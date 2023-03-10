import Head from 'next/head'
import Image from 'next/image'
import {Inter} from 'next/font/google'
import {Box, Button, HStack, Textarea, VStack} from "@chakra-ui/react";
import {trpc} from "../utils/trpc";
import {useState} from "react";
import {CaseType, EPOutputFormat} from "../promptbuilder/PromptBuilder";

const inter = Inter({subsets: ['latin']})

export default function Home() {
  const REFETCH_INTERVAL = 10000


  const extractMutation = trpc.extract.useMutation({
    onSuccess: (data) => {
      console.log(data)
      setExtUuid(data)
    }
  })


  const [extUuid, setExtUuid] = useState<string>('')
  const [text, setText] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const waitingForResult = extUuid !== '' ? result === '' : false
  const [refetchInterval, setRefetchInterval] = useState<number|false>(REFETCH_INTERVAL)
  const isLoading = extractMutation.isLoading || waitingForResult
  const fetchExtResultQuery = trpc.getExtractionResult.useQuery(
      {extractionID: extUuid}, {
        enabled: extUuid !== '',
        refetchInterval: refetchInterval,
        onSuccess: (data) => {
          console.log(data)
          if (data) {
            setRefetchInterval(false)
            setResult(data)
          }
        }
      }
    )

  const extract = () => {
    setResult('')
    setExtUuid('')
    setRefetchInterval(REFETCH_INTERVAL)
    extractMutation.mutate({
      text: text, extractionParams:
        {
          outputFormat: EPOutputFormat.HTMLTable,
          dateParams: {
            dateFormat: "DD-MMM-YYYY",
            addYear: true,
          },
          descParams: {
            cleanUp: true,
            caseType: CaseType.Lower,
            extractPhone: false,
            removePhone: true,
          },
          amountParams: {
            splitCreditDebit: true,
          },
          categoryParams: {
            categories: ["food", "travel", "shopping", "entertainment", "transfer"],
            blankCategoryWord: "misc"
          }
        }
    })
  }
  return (
    <>
      <Head>
        <title>Create hooooo App</title>
        <meta name="description" content="Generated by create next app"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <VStack w={'full'} alignItems={'stretch'}>

        {/*<HStack w={'full'} alignItems={'stretch'}>*/}
        <Textarea placeholder={"input"} onChange={e => setText(e.target.value)}/>
        <Button isLoading={isLoading} onClick={() => extract()}>Extract</Button>

        <Box dangerouslySetInnerHTML={{__html: result}}/>

        {/*</HStack>*/}
      </VStack>

    </>
  )
}
