import { Avatar, Box, Button, Flex, Textarea, VStack } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useState } from 'react'
import './App.css'

const backendURL = 'http://0.0.0.0:4000/graphql'

function App() {
  const [currentUser, setCurrentUser] = useState('abc')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const bottomRef = useRef(null)

  const fetchData = async () => {
    const query = /* GraphQL */ `
      query {
        getMessages {
          body
          from
        }
      }
    `

    const { data: { data: { getMessages } } } = await axios.post(backendURL, {
      query
    })

    getMessages && setMessages(getMessages)
  }

  const sendMessage = async () => {
    if (!input.length) {
      setInput('')
      return
    }

    const query = `
      mutation {
        createMessage (input: {
          body: "${input}",
          from: "${currentUser}"
        }) {
          body
          from
        }
      }
    `

    await axios.post(backendURL, {
      query
    })
    setInput('')
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const userId = localStorage.getItem('userId')

    if (userId) {
      setCurrentUser(userId)
    } else {
      const uid = uuidv4()
      localStorage.setItem('userId', uid)
    }
  }), []

  useEffect(() => {
    const url = new URL(backendURL)
    url.searchParams.append(
      'query',
      /* GraphQL */ `
        subscription {
          subMessages {
            body
            from
          }
        }
      `
    )
    const eventsource = new EventSource(url.toString(), {
      withCredentials: true
    })

    eventsource.onmessage = (event) => {
      const { data: { subMessages } } = JSON.parse(event.data)
      setMessages(subMessages)
    }

    fetchData()
  }, [])

  return (
    <Box h={'85%'}>
      <VStack
        bg="gray.100"
        h={'100%'}
        pb={'150px'}
        overflowY={'scroll'}
        p={4}
      >
        {messages && messages.map(({ from, body }) =>
          <Flex
            w={'100%'}
            p={2}
            justifyContent={
              from == currentUser ?
                'flex-end' :
                'flex-start'
            }
          >
            {from != currentUser && <Avatar
              name={`${from[0]} ${from[1]}`}
              size={'sm'}
              mr={2}
            />}
            <Box
              boxShadow={'base'}
              p={2}
              rounded='md'
              bg={
                from == currentUser ?
                  '#4169e1' :
                  'white'
              }
              textAlign='left'
              maxWidth={'75%'}
              textColor={
                from == currentUser ?
                  'white' :
                  'black'
              }
            >
              {body}
            </Box>
          </Flex>
        )}
        <Box ref={bottomRef} />
      </VStack>
      <Flex
        position={'fixed'}
        bottom={0}
        left={0}
        width={'100%'}
        p={4}
        alignItems={'center'}
        boxShadow={'base'}
        h={'15%'}
      >
        <Textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          h={'90%'}
          onKeyDown={(e) => {
            e.key == 'Enter' && sendMessage()
          }}
        />
        <Button
          bg={'#4169e1'}
          textColor={'white'}
          onClick={sendMessage}
          ml={4}
        >
          Send
        </Button>
      </Flex>
    </Box>
  )
}

export default App
