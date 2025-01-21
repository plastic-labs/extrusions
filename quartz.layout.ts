import { PageLayout, SharedLayout } from "./quartz/cfg"
import { SimpleSlug } from "./quartz/util/path"
import * as Component from "./quartz/components"
import { FileNode } from "./quartz/components/ExplorerNode"

// Create a date-based sort function for the explorer
const explorerSortDateFirst = (a: FileNode, b: FileNode) => {
  // Always keep folders before files
  if (a.file && !b.file) return 1
  if (!a.file && b.file) return -1
  
  // If both are files or both are folders
  if (a.file?.frontmatter?.date && b.file?.frontmatter?.date) {
    const parseDate = (dateStr: string) => {
      const [month, day, year] = dateStr.split('.')
      // Assuming YY format, convert to full year
      const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year)
      return new Date(fullYear, parseInt(month) - 1, parseInt(day))
    }
    
    const aDate = parseDate(a.file.frontmatter.date as string)
    const bDate = parseDate(b.file.frontmatter.date as string)
    
    // Sort descending (newest first)
    return bDate.getTime() - aDate.getTime()
  }
  
  // If only one has a date, prioritize it
  if (a.file?.frontmatter?.date) return -1
  if (b.file?.frontmatter?.date) return 1
  
  // Fall back to alphabetical sorting
  return a.displayName.localeCompare(b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/plastic-labs/blog",
      "Discord Community": "https://discord.gg/plasticlabs",
      "plasticlabs.ai": "https://plasticlabs.ai"
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
}

// components for pages that display lists of pages (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
