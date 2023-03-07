import { CategoriesOnArticle, Category } from '@prisma/client'
import { useRouter } from 'next/router'

import Image from 'next/image'

type TArticleProps = {
  disableLink?: boolean
  action?: boolean
  actionPercentage?: number
  description: string
  name: string
  price: number
  imageURL: string
  article_id: string
  categories: (CategoriesOnArticle & { category: Category })[]
}

const Article = ({
  disableLink,
  description,
  name,
  price,
  imageURL,
  categories,
  article_id,
  action,
  actionPercentage,
}: TArticleProps) => {
  const router = useRouter()
  return (
    <article
      onClick={async () => {
        if (!disableLink) await router.push(`/articles/${article_id}`)
      }}
      className='relative h-[320px] w-[250px] cursor-pointer rounded-lg border-2 bg-white drop-shadow-[0px_0px_2px] hover:drop-shadow-[0px_0px_6px_rgba(0,0,0,0.7)]'
    >
      <section className='relative flex w-full items-center justify-center'>
        <Image
          src={imageURL}
          alt='article image'
          width={250}
          height={150}
          className='rounded-xl rounded-b-none'
        />
        {action && (
          <span className='absolute bottom-0 left-0 right-0 h-10 bg-yellow-400 pl-4 text-xl font-semibold text-black'>
            Sniženje {actionPercentage}%
          </span>
        )}
      </section>
      <section className='mt-2 flex w-full flex-col p-2'>
        <h3 className='text-lg font-semibold tracking-tight text-gray-800'>
          {name}
        </h3>
        <p className='text-gray-400'>{description}</p>
        <div className='mt-2 grid grid-cols-2 grid-rows-2 gap-2'>
          {categories.map((category, i) => {
            if (i > 2) return
            return (
              <ArticleCategory
                key={Math.random().toString()}
                name={category.category.name}
              />
            )
          })}
        </div>
        <h2 className='absolute right-4 bottom-4 text-xl font-bold tracking-tighter text-gray-800'>
          {price}KM
        </h2>
      </section>
    </article>
  )
}

export default Article

const ArticleCategory = ({ name }: { name: string }) => {
  return (
    <div className='h-6 w-[100px] truncate rounded-sm bg-gray-200 px-2 text-sm text-gray-800 drop-shadow-[0px_0px_1px]'>
      {name}
    </div>
  )
}
