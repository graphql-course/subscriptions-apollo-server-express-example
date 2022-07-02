import { Db } from "mongodb";
import { getCharacters, getCharacter } from "../lib/db-operations";

// Resolver map
const queryResolvers = {
    Query: {
      async characters(_: void, __: any, context: { db: Db }) {
        return await getCharacters(context.db);
      },
      async character(_: void, { id }: any, context: { db: Db }) {
        return await getCharacter(context.db, id);
      },
    }
    
  };
export default queryResolvers;
  