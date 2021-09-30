import { Db } from "mongodb";
import { PubSub } from "graphql-subscriptions";
import { CHANGE_VOTES, COLLECTIONS, PHOTO_URL } from "../config/constants";
import { getCharacters, getCharacter, asignVoteId, getCharacterVotes } from "../lib/db-operations";


async function response(status: boolean, message: string, db: Db) {
  return {
    status,
    message,
    characters: await getCharacters(db),
  };
}
async function sendNotification(db: Db, pubsub: PubSub) {
  const characters = await getCharacters(db);
  await pubsub.publish(CHANGE_VOTES, { newVote: characters });
}

const mutationResolvers = {
  Mutation: {
    async addVote(
      _: void,
      { character }: any,
      context: { db: Db; pubsub: PubSub }
    ) {
      // Comprobar que el personaje existe
      const selectCharacter = await getCharacter(context.db, character);
      if (selectCharacter === null || selectCharacter === undefined) {
        return {
          id: -1,
          character:
            "El voto NO se ha emitido. Personaje NO existe Prueba de nuevo por favor",
          createdAt: new Date().toISOString(),
        };
      }

      // Obtenemos el id del voto y creamos el objeto del voto
      const vote = {
        id: await asignVoteId(context.db),
        character,
        createdAt: new Date().toISOString(),
      };
      // Añadimos el voto
      return await context.db
        .collection(COLLECTIONS.VOTES)
        .insertOne(vote)
        .then(async () => {
          sendNotification(context.db, context.pubsub);
          return vote;
        })
        .catch(async () => {
          return response(
            false,
            "El voto NO se ha emitido. Prueba de nuevo por favor",
            context.db
          );
        });
    },
  }  
};

export default mutationResolvers;
