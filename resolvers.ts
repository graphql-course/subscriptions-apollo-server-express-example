import { Db } from 'mongodb';

import { PubSub } from "graphql-subscriptions";
import { CHANGE_VOTES, COLLECTIONS, PHOTO_URL } from "./config/constants";
import { asignVoteId, getCharacter, getCharacters, getCharacterVotes } from "./db-operations";

 const pubsub = new PubSub();
 async function response(status: boolean, message: string, db: Db) {
    
    return {
        status,
        message,
        characters: await getCharacters(db)
    }
}
async function sendNotification() {
    pubsub.publish(CHANGE_VOTES, { newVote: 1})
}
 // Resolver map
 const resolvers = {

    Query: {
        async characters(_: void, __: any, { db }: any) {
            return await getCharacters(db);
        },
        async character(_: void,{ id }: any, { db }: any) {
            return await getCharacter(db, id);
        }
    },
    Mutation: {
        async addVote(_: void, { character }: any, { db}: any) {
            // Comprobar que el personaje existe
            const selectCharacter = await getCharacter(db, character);
            if (selectCharacter === null || selectCharacter === undefined) {
               return {
                   id: -1,
                   character: 'El voto NO se ha emitido. Personaje NO existe Prueba de nuevo por favor',
                   createdAt: new Date().toISOString()
               };
            }
            
            // Obtenemos el id del voto y creamos el objeto del voto
            const vote = {
                id: await asignVoteId(db),
                character,
                createdAt: new Date().toISOString()
            };
            // Añadimos el voto
            return await db.collection(COLLECTIONS.VOTES).insertOne(vote).then(
                async() => {
                    sendNotification();
                    return vote
                }
            ).catch(
                async() => {
                    return response(false, 'El voto NO se ha emitido. Prueba de nuevo por favor', db);
                }
            );    
        },
    },
    Subscription: {
        newVote: {
            subscribe: () => {
                console.log("Actualización");
                return pubsub.asyncIterator(["CHANGE_VOTES"]);
            }
        }
    },
    Character: {
        votes: async (parent: any, __: any, { db }: any) => {
            return await getCharacterVotes(db, parent.id);
        },
        photo: (parent: any) => PHOTO_URL.concat(parent.photo)
    }
    /*Query: {
      currentNumber() {
        return currentNumber;
      },
    },
    Mutation: {
        increment() {
              // Start incrementing
            incrementNumber();
            return currentNumber;
        }
    },
    Subscription: {
      numberIncremented: {
        subscribe: () => pubsub.asyncIterator(["NUMBER_INCREMENTED"]),
      },
    },*/
  };

  let currentNumber = 0;
  function incrementNumber() {
    currentNumber++;
    pubsub.publish("NUMBER_INCREMENTED", { numberIncremented: currentNumber });
  }

  export default resolvers;