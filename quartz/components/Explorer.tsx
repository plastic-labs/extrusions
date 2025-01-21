import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import explorerStyle from "./styles/explorer.scss"

// @ts-ignore
import script from "./scripts/explorer.inline"
import { ExplorerNode, FileNode, Options } from "./ExplorerNode"
import { QuartzPluginData } from "../plugins/vfile"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

// Options interface defined in `ExplorerNode` to avoid circular dependency
const defaultOptions = {
  folderClickBehavior: "collapse" as const,
  folderDefaultState: "collapsed" as const,
  useSavedState: true,
  mapFn: (node: FileNode) => {
    return node
  },
  sortFn: (a: FileNode, b: FileNode) => {
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
  },
  filterFn: (node: FileNode) => node.name !== "tags",
  order: ["filter", "map", "sort"] as const,
} satisfies Options

export default ((userOpts?: Partial<Options>) => {
  // Parse config
  const opts = { ...defaultOptions, ...userOpts }

  // memoized
  let fileTree: FileNode
  let jsonTree: string

  function constructFileTree(allFiles: QuartzPluginData[]) {
    if (fileTree) {
      return
    }

    // Construct tree from allFiles
    fileTree = new FileNode("")
    allFiles.forEach((file) => fileTree.add(file))

    // Execute all functions (sort, filter, map) that were provided
    if (opts.order) {
      // Order is important, use loop with index instead of order.map()
      for (let i = 0; i < opts.order.length; i++) {
        const functionName = opts.order[i]
        if (functionName === "map") {
          fileTree.map(opts.mapFn)
        } else if (functionName === "sort") {
          fileTree.sort(opts.sortFn)
        } else if (functionName === "filter") {
          fileTree.filter(opts.filterFn)
        }
      }
    }

    // Get all folders of tree. Initialize with collapsed state
    // Stringify to pass json tree as data attribute ([data-tree])
    const folders = fileTree.getFolderPaths(opts.folderDefaultState === "collapsed")
    jsonTree = JSON.stringify(folders)
  }

  const Explorer: QuartzComponent = ({
    cfg,
    allFiles,
    displayClass,
    fileData,
  }: QuartzComponentProps) => {
    constructFileTree(allFiles)
    return (
      <div class={classNames(displayClass, "explorer")}>
        <button
          type="button"
          id="explorer"
          data-behavior={opts.folderClickBehavior}
          data-collapsed={opts.folderDefaultState}
          data-savestate={opts.useSavedState}
          data-tree={jsonTree}
        >
          <h1>{opts.title ?? i18n(cfg.locale).components.explorer.title}</h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="5 8 14 8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div id="explorer-content">
          <ul class="overflow" id="explorer-ul">
            <ExplorerNode node={fileTree} opts={opts} fileData={fileData} />
            <li id="explorer-end" />
          </ul>
        </div>
      </div>
    )
  }

  Explorer.css = explorerStyle
  Explorer.afterDOMLoaded = script
  return Explorer
}) satisfies QuartzComponentConstructor
