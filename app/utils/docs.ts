import {
  extractFrontMatter,
  fetchRepoFile,
  markdownToMdx,
} from '~/utils/documents.server'
import removeMarkdown from 'remove-markdown'
import { notFound, redirect } from '@tanstack/react-router'
import { createServerFn, json } from '@tanstack/react-router-server'

export const loadDocs = async ({
  repo,
  branch,
  docsPath,
  currentPath,
  redirectPath,
}: {
  repo: string
  branch: string
  docsPath: string
  currentPath: string
  redirectPath: string
}) => {
  if (!branch) {
    throw new Error('Invalid branch')
  }

  if (!docsPath) {
    throw new Error('Invalid docPath')
  }

  const filePath = `${docsPath}.md`

  return await fetchDocs({
    repo,
    branch,
    filePath,
    currentPath,
    redirectPath,
  })
}

export const fetchDocs = createServerFn(
  'GET',
  async ({
    repo,
    branch,
    filePath,
    currentPath,
    redirectPath,
  }: {
    repo: string
    branch: string
    filePath: string
    currentPath: string
    redirectPath: string
  }) => {
    'use server'

    const file = await fetchRepoFile(repo, branch, filePath)

    if (!file) {
      throw notFound()
      // if (currentPath === redirectPath) {
      //   // console.log('not found')
      //   throw notFound()
      // } else {
      //   // console.log('redirect')
      //   throw redirect({
      //     to: redirectPath,
      //   })
      // }
    }

    const frontMatter = extractFrontMatter(file)
    const description = removeMarkdown(frontMatter.excerpt ?? '')

    const mdx = await markdownToMdx(frontMatter.content)

    return json(
      {
        title: frontMatter.data?.title,
        description,
        filePath,
        content: mdx.code,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=1, stale-while-revalidate=300',
        },
      }
    )
  }
)
