/** @type {import("syncpack").RcFile} */
module.exports = {
  dependencyTypes: ['prod', 'dev'],
  lintFormatting: false,
  semverGroups: [
    {
      packages: ['**'],
      dependencies: ['svelte'],
      range: '',
    },
    {
      packages: ['**'],
      dependencies: ['**'],
      range: '^',
    },
  ],
};
