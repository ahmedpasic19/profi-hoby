import { type AppType } from 'next/app'
import { type Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import '../styles/globals.css'
import Head from 'next/head'
import Navbar from '../components/layout/Navbar'
import SearchBar from '../components/SearchBar'
import ContactBlob from '../components/layout/ContactBlob'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/router'

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * (60 * 1000), // 10 mins
      cacheTime: 15 * (60 * 1000), // 15 mins
    },
  },
})

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter()
  const { article_id } = router.query

  return (
    <QueryClientProvider client={client}>
      <SessionProvider session={session}>
        <Head>
          <title>Profihoby</title>
          <meta name='description' content='Generated by create-t3-app' />
          <link rel='icon' href='/favicon.ico' />
        </Head>
        {router.pathname !== '/signin' && <Navbar />}
        {router.pathname != '/articles' &&
          router.pathname != '/categories' &&
          router.pathname != '/signin' &&
          router.pathname != '/groups' &&
          router.pathname != '/actions' &&
          !article_id &&
          router.pathname != '/articles/create-article' && <SearchBar />}
        <Component {...pageProps} />
        <ContactBlob />
      </SessionProvider>
    </QueryClientProvider>
  )
}

export default MyApp
