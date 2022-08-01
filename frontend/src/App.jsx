import { Box, Flex, Button, Textarea, VStack, Avatar } from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState('abc')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])

  const bottomRef = useRef(null);

  const fetchData = async () => {
    const query = `query {
      getMessages {
        body
        from
      }
    }`
    const { data: { data: { getMessages } } } = await axios.post('http://localhost:4000/graphql', {
      query
    })
    getMessages && setMessages(getMessages)
  }

  useEffect(() => {
    const url = new URL('http://localhost:4000/graphql')
    url.searchParams.append(
      'query',
      /* GraphQL */ `
        subscription {
          subMessages {
            body
            from
          }
        }
      `,
    )

    const eventsource = new EventSource(url.toString(), {
      withCredentials: true, // This is required for cookies
    })

    eventsource.onmessage = function (event) {
      const { data: { subMessages } } = JSON.parse(event.data)
      setMessages(subMessages)
    }

    fetchData()
  }, [])

  const sendMessage = async () => {
    if (!input.length) {
      setInput('')
      return
    }
    const query = `mutation {
      createMessage(input: {
        body: "${input}",
        from: "${currentUser}"
      }) {
        body
        from
      }
    }`
    const { data } = await axios.post('http://localhost:4000/graphql', {
      query
    })
    console.log(data)
    setInput('')
  }

  useEffect(() => {
    // 👇️ scroll to bottom every time messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      setCurrentUser(userId)
    } else {
      const uid = uuidv4()
      localStorage.setItem('userId', uid)
    }
  }, [])

  return (
    <Box>
      <VStack bg="gray.100" h={'100%'} pb={"150px"} overflowY={"scroll"} p="4">
        {messages && messages.length && messages.map(({ from, body }) =>
          <Flex
            w={'100%'}
            p={2}
            justifyContent={
              from == currentUser ? 'flex-end' : 'flex-start'
            }
          >
            {from != currentUser && <Avatar name={from} size='sm' mr={2} mt={2} />}
            <Box
              boxShadow='base'
              p='2'
              rounded='md'
              bg={from != currentUser ? 'white' : '#4169e1'}
              textAlign={'left'}
              maxWidth={"75%"}
              textColor={from == currentUser ? 'white' : 'black'}
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
        w={'100%'}
        p={4}
        alignItems={'center'}
        boxShadow='base'
        bg='white'
      >
        <Textarea onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e) => {
          e.key === 'Enter' && sendMessage()
        }} />
        <Button bg={'#4169e1'} ml={4} textColor={"white"} onClick={sendMessage} onKeyDown={(e) => {
          console.log(e.key)
        }}>
          Send
        </Button>
      </Flex>
    </Box>
  )
}

export default App
