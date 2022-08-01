const { createServer, createPubSub } = require('@graphql-yoga/node')

const pubSub = createPubSub()
const messages = []

// Provide your schema
const server = createServer({
  schema: {
    typeDefs: /* GraphQL */ `
      type Message {
        body: String!
        from: String!
      }

      input MessageInput {
        body: String!
        from: String!
      }

      type Query {
        getMessages: [Message!]!
      }

      type Subscription {
        subMessages: [Message]!
      }

      type Mutation {
        createMessage(
          input: MessageInput
        ): Message
      }
    `,
    resolvers: {
      Query: {
        getMessages: () => {
          return messages
        },
      },
      Subscription: {
        subMessages: {
          // subscribe to the randomNumber event
          subscribe: () => pubSub.subscribe('messages'),
          resolve: (payload) => payload,
        },
      },
      Mutation: {
        createMessage: (_, args) => {
          // publish a random number
          messages.push(args.input)
          pubSub.publish('messages', messages)
          return args.input
        },
      },
    },
  },
})

server.start()