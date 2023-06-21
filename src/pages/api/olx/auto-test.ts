import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

import { parseTextFormat } from '../../../utils/formatText'

import { env } from '../../../env/server.mjs'

const prisma = new PrismaClient()

const OLX_API = env.OLX_API
const USERNAME = env.OLX_USERNAME
const PASSWORD = env.OLX_PASSWORD

type Country = { id: number; name: string; code: string }

type Category = {
  id: number
  count: 1148
  name: string
  parent_categories: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const articles = await prisma.article.findMany({
      where: { olx_id: null },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    const auth: { data: { token?: string } } = await axios.post(
      OLX_API + '/auth/login',
      {
        username: USERNAME,
        password: PASSWORD,
        device_name: 'integration',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!auth.data.token)
      return res.status(403).json({ message: 'No token recieved' })

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]

      /////////////////////
      // GET new article
      if (!article)
        return res.status(404).json({ message: 'Article not found' })

      const countries: { data: { data: Country[] } } = await axios.get(
        OLX_API + '/countries'
      )

      if (!countries.data)
        return res.status(500).json({ message: 'Cannot GET /countries' })

      // Find BiH in countries response
      const country = countries?.data?.data?.find(
        (country) => country.code === 'BA'
      )

      if (!country) return res.status(500).json({ message: "Can't find BiH" })
      console.log('article name: ', article.name)

      const uri = encodeURI(
        OLX_API +
          `/categories/suggest?keyword=${article.name.replace(/\s/g, '%')}`
      )
      console.log('req suggested category: ', uri)
      // Sugested categories by the OLX api
      const categories: { data: { data: Category[] } } = await axios.get(uri)
      console.log(categories.data)
      if (!categories.data)
        return res
          .status(500)
          .json({ message: 'Cannot GET /categories/suggest?keyword' })

      const category = categories.data.data[0]

      // Category "sve ostalo" in case category is not found
      const backup_category_id = 947

      const attributes: { data: { data: object[] } } = await axios.get(
        OLX_API + `/categories/${category?.id || backup_category_id}/attributes`
      )

      console.log('attributes:', Object.keys(attributes.data.data))

      // POST article to olx api
      // const response: { data: { error: string } } = await

      console.log('POST LISTING BODY: ', {
        title: article?.name.substring(0, 54), // required and min 2 words
        listing_type: 'sell', // required
        category_id: category?.id || backup_category_id, // required
        short_description: parseTextFormat(
          article.description
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .substring(0, 244)
        ),
        description: parseTextFormat(
          article.description
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .substring(0, 244)
        ),
        country_id: country.id,
        city_id: 35,
        price: article.base_price,
        available: false,
        state: 'new',
        ...(attributes?.data.data.length ? { attributes: [] } : {}),
      })

      await axios
        .post(
          OLX_API + '/listings',
          {
            title: article?.name.substring(0, 54), // required and min 2 words
            listing_type: 'sell', // required
            category_id: category?.id || backup_category_id, // required
            short_description: parseTextFormat(
              article.description
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .substring(0, 244)
            ),
            description: parseTextFormat(
              article.description
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .substring(0, 244)
            ),
            country_id: country.id,
            city_id: 35,
            price: article.base_price,
            available: false,
            state: 'new',
            ...(attributes?.data.data.length ? { attributes: [] } : {}),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.data.token}`,
            },
          }
        )
        .then(async (response: { data: { id: number } }) => {
          console.log('OLX ID RESPONSE: ', response.data)

          // Wright olx listing id to article olx_id field
          await prisma.article.update({
            where: { id: article.id },
            data: { olx_id: response.data.id },
          })
        })
        // eslint-disable-next-line
        .catch((error: { response: { data: any } }) => {
          console.log(error?.response?.data)
        })

      ////////////////////////

      ///////////////////////////

      // GET article olx_id
      const article1 = await prisma.article.findUnique({
        where: { id: article?.id },
        select: { id: true, olx_id: true },
      })

      if (!article1)
        return res.status(404).json({ message: 'Article not found' })

      if (!article1?.olx_id)
        return res
          .status(404)
          .json({ message: "Article isn't assigned a listing id" })

      // GET S3 access_url from article1 images
      const images = await prisma.image.findMany({
        where: {
          article_id: article1.id,
        },
        select: {
          access_url: true,
          key: true,
        },
      })

      if (!images || !images.length)
        return res.status(404).json({ message: 'Images not found' })

      // POST all images to OLX
      for (let i = 0; i < images.length; i++) {
        if (!images[i]?.access_url || !images[i]?.key)
          return console.log('No file image')

        const image = await fetch(images[i]?.access_url || '')

        const imageBlob = await image.blob()

        const formData = new FormData()

        formData.append('images[]', imageBlob, images[i]?.key)
        console.log('IMAGE UPLOAD FORMDATA: ', formData)
        fetch(OLX_API + `/listings/${article1.olx_id}/image-upload`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${auth.data.token}`,
          },
        })
          .then((response) => response.text())
          .then((data) => {
            console.log('UPLOAD RESPONSE: ', data)
            // Process the response data here
          })
          .catch((error) => {
            console.error('Error:', error)
          })
      }

      // When listing is added to olx api its in a "draft" state
      // It needs to be published for listing upload to be finished
      const publish = await axios.post(
        OLX_API + `/listings/${article1.olx_id}/publish`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.data.token}`,
          },
        }
      )

      console.log('PUBLISH DATA: ', publish.data)
      ////////////////////

      // Wait a minute before running againt
      // This is to not make to many api calls
      await new Promise((resolve) => setTimeout(resolve, 60000))
    }
    return res.status(200).json({ message: 'Syncing completed.' })
  } catch (error) {
    // @ts-ignore
    console.log(Object.keys(error))
    console.log('cath errormessage: ', error)
    res.status(500).json(error)
  }
}
