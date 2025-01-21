import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import explorerStyle from "./styles/explorer.scss"
import { getDate } from "./Date"
import { GlobalConfiguration } from "../cfg"
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
  mapFn: (node: FileNode) => node,
  sortFn: (a: FileNode, b: FileNode) => {
    // Folders before files
    if (!a.file !== !b.file) return a.file ? 1 : -1

    // Both are files, try date-based sorting
    if (a.file && b.file) {
      const [aDate, bDate] = [a.file, b.file].map(f => 
        getDate(f.cfg as GlobalConfiguration, f))
      
      if (aDate || bDate) return bDate ? (aDate ? bDate.getTime() - aDate.getTime() : 1) : -1
    }
    
    // Fallback to alphabetical
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

  const applyOperation = (tree: FileNode, op: string) => {
    const operations = {
      map: () => tree.map(opts.mapFn),
      sort: () => tree.sort(opts.sortFn),
      filter: () => tree.filter(opts.filterFn),
    }
    operations[op as keyof typeof operations]?.()
  }

  function constructFileTree(allFiles: QuartzPluginData[], cfg: GlobalConfiguration) {
    if (fileTree) {
      return
    }

    // Construct tree from allFiles
    fileTree = new FileNode("")
    allFiles.forEach((file) => {
      // Ensure the configuration is passed to each file
      file.cfg = cfg
      fileTree.add(file)
    })

    // Execute all functions (sort, filter, map) that were provided
    if (opts.order) {
      // Order is important, use loop with index instead of order.map()
      for (let i = 0; i < opts.order.length; i++) {
        const functionName = opts.order[i]
        applyOperation(fileTree, functionName)
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
    constructFileTree(allFiles, cfg)
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
