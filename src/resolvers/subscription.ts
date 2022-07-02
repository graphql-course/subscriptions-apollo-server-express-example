import { AblyPubSub } from "graphql-ably-pubsub";
const options = {
  key: process.env.ABLY_PUBSUB_KEY
}
const pubsub = new AblyPubSub(options);
import { Db } from "mongodb";
import { CHANGE_VOTES } from "../config/constants";

const subscriptionResolvers = {
  Subscription: {
    newVote: {
      resolve: (payload: any) =>
        payload.newVote,
      subscribe: async (_: unknown, __: unknown, context: { db: Db }) =>
        pubsub.asyncIterator([CHANGE_VOTES]),
    },
  }
}

export default subscriptionResolvers;