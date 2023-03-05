import type { AppType } from 'next/app';
import {ChakraProvider} from "@chakra-ui/provider";
import {trpc} from '../utils/trpc'

const MyApp: AppType = ({ Component, pageProps }) => {  return (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}
export default trpc.withTRPC(MyApp)