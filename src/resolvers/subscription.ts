import { PubSub } from "graphql-subscriptions";
import { Db } from "mongodb";
import { CHANGE_VOTES } from "../config/constants";


const subscriptionResolvers = {
  Subscription: {
    newVote: {
      resolve: (payload: any) =>
        payload.newVote,
      subscribe: async (_: unknown, __: unknown, context: { db: Db, pubsub: PubSub}) =>
        context.pubsub.asyncIterator([CHANGE_VOTES]),
    },
  }
}

export default subscriptionResolvers;