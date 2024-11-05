import * as AST from '../ast';
import type { PreprocessorGroup } from 'svelte/compiler';
import type { Plugin } from 'vite';
import type { ContextHolder } from '../types';

export const transformGraphQLPlugin = (contextHolder: ContextHolder): Plugin => {
  const sveltePreprocess: PreprocessorGroup = {
    name: '@readable/gql:transform-graphql',
    script: ({ content, attributes }) => {
      if (attributes.lang !== 'ts' || attributes.type !== undefined) {
        return;
      }

      const { context } = contextHolder;
      if (!context) {
        return;
      }

      let program;
      try {
        program = AST.parse(content);
      } catch {
        return;
      }

      let propsUsed = false;

      AST.walk(program, {
        visitCallExpression(p) {
          const { node } = p;

          if (node.callee.type === 'Identifier' && node.callee.name === 'fragment') {
            p.replace(
              AST.b.callExpression.from({
                callee: AST.b.identifier('$derived'),
                arguments: [node],
              }),
            );

            return false;
          }

          this.traverse(p);
        },
      });

      AST.walk(program, {
        visitCallExpression(p) {
          const { node } = p;

          if (
            node.callee.type === 'Identifier' &&
            node.callee.name === 'graphql' &&
            node.arguments[0].type === 'TemplateLiteral'
          ) {
            const source = node.arguments[0].quasis[0].value.raw;
            const artifact = context.artifacts.find((artifact) => artifact.source === source);

            if (artifact) {
              if (artifact.kind === 'fragment') {
                p.replace(AST.b.nullLiteral());
              } else if (artifact.kind === 'query' && artifact.meta.mode !== 'manual') {
                p.replace(
                  AST.b.callExpression.from({
                    callee: AST.b.identifier('$derived'),
                    arguments: [AST.b.identifier(`__gql_props.data.__gql_${artifact.name}`)],
                  }),
                );
                propsUsed = true;
              } else {
                p.replace(
                  AST.b.callExpression.from({
                    callee: AST.b.identifier(`__gql_${artifact.name}`),
                    arguments: [],
                  }),
                );
                program.body.unshift(
                  AST.b.importDeclaration.from({
                    source: AST.b.stringLiteral(`$graphql/artifacts/operations/${artifact.name}`),
                    specifiers: [
                      AST.b.importDefaultSpecifier.from({
                        local: AST.b.identifier(`__gql_${artifact.name}`),
                      }),
                    ],
                  }),
                );
              }
            }
          }

          this.traverse(p);
        },
      });

      if (propsUsed) {
        AST.walk(program, {
          visitCallExpression(p) {
            const { node } = p;
            if (node.callee.type === 'Identifier' && node.callee.name === '$props') {
              p.replace(AST.b.identifier('__gql_props'));
            }

            this.traverse(p);
          },
        });

        program.body.unshift(
          AST.b.variableDeclaration.from({
            kind: 'let',
            declarations: [
              AST.b.variableDeclarator.from({
                id: AST.b.identifier('__gql_props'),
                init: AST.b.callExpression.from({
                  callee: AST.b.identifier('$props'),
                  arguments: [],
                }),
              }),
            ],
          }),
        );
      }

      return {
        code: AST.print(program),
      };
    },
  };

  return {
    name: '@readable/gql:transform-graphql',
    enforce: 'post',

    api: { sveltePreprocess },
  };
};
