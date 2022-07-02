import { Db } from "mongodb";
import { PHOTO_URL } from "../config/constants";
import { getCharacterVotes } from "../lib/db-operations";

const typesResolvers = {
  Character: {
    votes: async (parent: any, __: any, context: { db: Db }) => {
      return await getCharacterVotes(context.db, parent.id);
    },
    photo: (parent: any) => PHOTO_URL.concat(parent.photo),
  },
};

export default typesResolvers;
