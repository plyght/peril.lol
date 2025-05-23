import { visit } from "unist-util-visit"
import { h } from "hastscript"

/**
 * @import {Root} from 'hast'
 */

export function rehypeFigure(option) {
  const className = (option && option.className) || "rehype-figure"

  function buildFigure({ properties }) {
    const figure = h("figure", { class: className }, [
      h("img", { ...properties }),
      properties.alt && properties.alt.trim().length > 0
        ? h("figcaption", properties.alt)
        : "",
    ])
    return figure
  }

  /**
   * @param {Root} tree
   */
  return function (tree) {
    visit(tree, { tagName: "p" }, (node, index) => {
      const images = node.children
        .filter((n) => n.tagName === "img")
        .filter((n) => n.properties.alt.length > 0)
        .map((img) => buildFigure(img))

      if (images.length === 0) return

      tree.children[index] =
        images.length === 1
          ? images[0]
          : (tree.children[index] = h(
              "div",
              { class: `${className}-container` },
              images
            ))
    })
  }
}