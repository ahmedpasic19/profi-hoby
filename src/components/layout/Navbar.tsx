import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { signOut, useSession } from 'next-auth/react'

import { useQuery } from '@tanstack/react-query'
import { trpcClient } from '../../utils/api'

import Image from 'next/image'
import Link from 'next/link'
import DropdownMenu from './navbar/DropdownMenu'

const Navbar = () => {
  const [openDropDown, setOpenDropDown] = useState(false)

  const { data: allWorkers } = useQuery(['workers.getAllWorkers'], () =>
    trpcClient.workers.getAllWorkers.query()
  )

  const { data, status } = useSession()

  // For admin/worker users
  const authenticated = [
    {
      href: '/',
      label: 'Početna stranica',
    },
    {
      href: '/articles',
      label: 'Artikli',
    },
    {
      href: '/categories',
      label: 'Kategorije',
    },
    {
      href: '/groups',
      label: 'Grupe',
    },
    {
      href: '/workers',
      label: 'Radnici',
    },
    {
      href: '/actions',
      label: 'Akcije',
    },
    {
      href: '/sales',
      label: 'Sniženja',
    },
  ]

  // For non-admin/non-worker users
  const unauthenticated = [
    {
      href: '/',
      label: 'Početna stranica',
    },
    {
      href: '/sales',
      label: 'Sniženja',
    },
    status === 'unauthenticated'
      ? {
          href: '/signin',
          label: 'Login',
        }
      : {
          href: '',
          label: '',
        },
  ]

  // find if user is a worker
  const worker = allWorkers?.find(
    (worker) => worker.user.email === data?.user?.email
  )

  const navlinks =
    status === 'authenticated' && worker ? authenticated : unauthenticated

  const router = useRouter()
  const { article_id } = router.query

  // Prevent scrolling when the modal is open
  useEffect(() => {
    if (openDropDown) {
      // Disable scrolling
      document.body.style.overflow = 'hidden'
    } else {
      // Re-enable scrolling
      document.body.style.overflow = 'auto'
    }
  }, [openDropDown])

  return (
    <>
      <nav
        className={
          (article_id ? 'sticky' : 'fixed') +
          'relative top-0 left-0 z-20 w-full border-b border-gray-200 bg-white px-2 py-2.5 sm:px-4'
        }
      >
        <div className='mx-auto flex items-center justify-between'>
          <Link href='/' className='flex items-center'>
            <Image
              src='https://flowbite.com/docs/images/logo.svg'
              width={200}
              height={100}
              className='mr-3 h-6 sm:h-9'
              alt='Flowbite Logo'
            />
            <span className='self-center whitespace-nowrap text-xl font-semibold'>
              Profihoby
            </span>
          </Link>
          <div className='flex md:order-2'>
            {/* Log out btn */}
            {status === 'authenticated' && (
              <button
                onClick={() => signOut()}
                type='button'
                className='rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:hidden md:mr-0 lg:visible lg:bg-red-600'
              >
                Log out
              </button>
            )}
            <button
              onClick={() => setOpenDropDown(true)}
              data-collapse-toggle='navbar-sticky'
              type='button'
              className='inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden'
              aria-controls='navbar-sticky'
              aria-expanded='false'
            >
              <span className='sr-only'>Open main menu</span>
              <svg
                className='h-6 w-6'
                aria-hidden='true'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                  clipRule='evenodd'
                ></path>
              </svg>
            </button>
          </div>
          {/* Link list */}
          <div
            className='hidden w-full items-center justify-between md:order-1 md:flex md:w-auto'
            id='navbar-sticky'
          >
            <ul className='mt-4 flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-white md:text-sm md:font-medium'>
              {navlinks.map((link) => (
                <NavLink key={link.label} href={link.href} label={link.label} />
              ))}
            </ul>
          </div>
          {/* Dropdown */}
          <DropdownMenu
            isOpen={openDropDown}
            setIsOpen={setOpenDropDown}
            links={navlinks}
          />
        </div>
      </nav>
      {/* Blur element */}
      {openDropDown && (
        <div
          onClick={() => setOpenDropDown(false)}
          className=' absolute inset-0 z-10 h-screen w-full bg-black bg-opacity-30 backdrop-blur-sm backdrop-filter'
        />
      )}
    </>
  )
}

export default Navbar

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const router = useRouter()

  return (
    <li>
      <Link
        href={href}
        className={`block rounded bg-blue-700 py-2 pl-3 pr-4 md:bg-transparent md:p-0 ${
          router.pathname === href ? 'text-blue-700' : 'text-gray-800'
        }`}
        aria-current={router.pathname === href}
      >
        {label}
      </Link>
    </li>
  )
}
