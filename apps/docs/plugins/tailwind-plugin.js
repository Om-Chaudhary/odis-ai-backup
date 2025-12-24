/**
 * Tailwind CSS PostCSS Plugin for Docusaurus
 *
 * Integrates Tailwind CSS v4 with Docusaurus by pushing the @tailwindcss/postcss
 * plugin into the PostCSS pipeline while maintaining compatibility with other
 * plugins like Sass.
 */
module.exports = function tailwindPlugin() {
  return {
    name: "tailwind-plugin",
    configurePostCss(postcssOptions) {
      // Push to maintain compatibility with other PostCSS plugins (like Sass)
      postcssOptions.plugins.push(require("@tailwindcss/postcss"));
      return postcssOptions;
    },
  };
};
