import { PubSub } from "graphql-subscriptions";

 const pubsub = new PubSub();
 // Resolver map
 const resolvers = {
    Query: {
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
    },
  };

  let currentNumber = 0;
  function incrementNumber() {
    currentNumber++;
    pubsub.publish("NUMBER_INCREMENTED", { numberIncremented: currentNumber });
  }

  export default resolvers;