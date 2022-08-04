const { createServer, createPubSub } = require('@graphql-yoga/node')

const pubSub = createPubSub()

const messages = []

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

      type Mutation {
        createMessage(
          input: MessageInput
        ): Message
      }

      type Subscription {
        subMessages: [Message]!
      }
    `,
    resolvers: {
      Query: {
        getMessages: () => {
          return messages
        }
      },
      Mutation: {
        createMessage: (_, args) => {
          messages.push(args.input)
          pubSub.publish('messages', messages)
          return args.input
        }
      },
      Subscription: {
        subMessages: {
          subscribe: () => pubSub.subscribe('messages'),
          resolve: (payload) => payload,
        }
      }
    }
  }
})

server.start()