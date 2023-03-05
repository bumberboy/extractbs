import Head from 'next/head'
import Image from 'next/image'
import {Inter} from 'next/font/google'
import {Box} from "@chakra-ui/react";
import {trpc} from "../utils/trpc";

const inter = Inter({subsets: ['latin']})

export default function Home() {
  const hello = trpc.hello.useQuery({text: ' bowwow'})
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <main>
        <Box>
          Hello {
          hello.data?.greeting
        }
        </Box>
      </main>
    </>
  )
}
