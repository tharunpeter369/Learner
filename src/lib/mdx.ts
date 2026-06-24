import fs from 'fs'
import path from 'path'

const contentBaseDir = path.join(process.cwd(), 'src/content')

export async function getModuleContent(pathId: string, moduleId: string) {
  try {
    const filePath = path.join(contentBaseDir, pathId, `${moduleId}.mdx`)
    if (!fs.existsSync(filePath)) {
      return null
    }
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.error("Error reading MDX file:", error)
    return null
  }
}
