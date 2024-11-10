import recast from 'recast';
import * as AST from '../ast';
import type { Plugin } from 'vite';
import type { ContextHolder } from '../types';

export const transformLoadPlugin = (contextHolder: ContextHolder): Plugin => {
  return {
    name: '@readable/gql:transform-load',
    enforce: 'post',

    transform: (code, id) => {
      const { context } = contextHolder;
      if (!context) {
        return;
      }

      if (!id.endsWith('+page.ts') && !id.endsWith('+layout.ts')) {
        return;
      }

      const queries = context.artifacts.filter(
        (artifact) =>
          artifact.kind === 'query' &&
          artifact.meta.mode !== 'manual' &&
          artifact.file.startsWith(id.replace(/\.ts$/, '')),
      );

      if (queries.length === 0) {
        return;
      }

      let program;
      try {
        program = AST.parse(code);
      } catch {
        return;
      }

      const exportedVariables: Record<string, recast.types.namedTypes.VariableDeclarator> = {};

      AST.walk(program, {
        visitExportNamedDeclaration(p) {
          const { node } = p;

          if (node.declaration?.type === 'VariableDeclaration') {
            for (const declaration of node.declaration.declarations) {
              if (declaration.type === 'VariableDeclarator' && declaration.id.type === 'Identifier') {
                exportedVariables[declaration.id.name] = declaration;
              }
            }
          }

          this.traverse(p);
        },
      });

      const loaders = ['__gql_load'];
      if ('load' in exportedVariables) {
        // @ts-expect-error already checked
        exportedVariables.load.id.name = '__gql_original_load';
        loaders.unshift('__gql_original_load');
      }

      program.body.push(
        AST.b.importDeclaration.from({
          source: AST.b.stringLiteral('svelte/store'),
          specifiers: [
            AST.b.importSpecifier.from({
              imported: AST.b.identifier('get'),
              local: AST.b.identifier('__gql_get'),
            }),
          ],
        }),
        AST.b.importDeclaration.from({
          source: AST.b.stringLiteral('@readable/gql/runtime'),
          specifiers: [
            AST.b.importSpecifier.from({
              imported: AST.b.identifier('handleError'),
              local: AST.b.identifier('__gql_handleError'),
            }),
          ],
        }),
        ...queries.map((query) =>
          AST.b.importDeclaration.from({
            source: AST.b.stringLiteral(`$graphql/artifacts/operations/${query.name}`),
            specifiers: [
              AST.b.importDefaultSpecifier.from({
                local: AST.b.identifier(`__gql_${query.name}`),
              }),
            ],
          }),
        ),
        AST.b.functionDeclaration.from({
          id: AST.b.identifier('__gql_load'),
          params: [AST.b.identifier('event')],
          async: true,
          body: AST.b.blockStatement([
            AST.b.variableDeclaration.from({
              kind: 'let',
              declarations: queries.map((query) =>
                AST.b.variableDeclarator.from({
                  id: AST.b.identifier(query.name),
                  init: AST.b.nullLiteral(),
                }),
              ),
            }),
            ...queries.map((query) =>
              AST.b.tryStatement.from({
                block: AST.b.blockStatement([
                  AST.b.expressionStatement(
                    AST.b.assignmentExpression.from({
                      operator: '=',
                      left: AST.b.identifier(query.name),
                      right: AST.b.awaitExpression(
                        AST.b.callExpression.from({
                          callee: AST.b.callExpression.from({
                            callee: AST.b.identifier(`__gql_${query.name}`),
                            arguments: [],
                          }),
                          arguments: [
                            AST.b.identifier('event.fetch'),
                            `_${query.name}_Variables` in exportedVariables
                              ? AST.b.awaitExpression(
                                  AST.b.callExpression.from({
                                    callee: AST.b.identifier(`_${query.name}_Variables`),
                                    arguments: [AST.b.identifier('event')],
                                  }),
                                )
                              : AST.b.identifier('undefined'),
                            `_${query.name}_Extensions` in exportedVariables
                              ? AST.b.identifier(`_${query.name}_Extensions`)
                              : AST.b.identifier('undefined'),
                          ],
                        }),
                      ),
                    }),
                  ),
                ]),
                handler: AST.b.catchClause.from({
                  param: AST.b.identifier('error'),
                  body: AST.b.blockStatement([
                    ...(`_${query.name}_OnError` in exportedVariables
                      ? [
                          AST.b.expressionStatement(
                            AST.b.awaitExpression(
                              AST.b.callExpression.from({
                                callee: AST.b.identifier(`_${query.name}_OnError`),
                                arguments: [AST.b.identifier('error'), AST.b.identifier('event')],
                              }),
                            ),
                          ),
                        ]
                      : []),
                    AST.b.expressionStatement(
                      AST.b.awaitExpression(
                        AST.b.callExpression.from({
                          callee: AST.b.identifier('__gql_handleError'),
                          arguments: [AST.b.identifier('error'), AST.b.identifier('event')],
                        }),
                      ),
                    ),
                    AST.b.throwStatement(AST.b.identifier('error')),
                  ]),
                }),
              }),
            ),
            ...queries
              .filter((query) => `_${query.name}_AfterLoad` in exportedVariables)
              .map((query) =>
                AST.b.expressionStatement(
                  AST.b.awaitExpression(
                    AST.b.callExpression.from({
                      callee: AST.b.identifier(`_${query.name}_AfterLoad`),
                      arguments: [
                        AST.b.callExpression.from({
                          callee: AST.b.identifier('__gql_get'),
                          arguments: [AST.b.identifier(query.name)],
                        }),
                        AST.b.identifier('event'),
                      ],
                    }),
                  ),
                ),
              ),
            AST.b.returnStatement(
              AST.b.objectExpression(
                queries.map((query) =>
                  AST.b.objectProperty.from({
                    key: AST.b.identifier(`__gql_${query.name}`),
                    value: AST.b.identifier(query.name),
                  }),
                ),
              ),
            ),
          ]),
        }),
        AST.b.exportNamedDeclaration(
          AST.b.functionDeclaration.from({
            id: AST.b.identifier('load'),
            params: [AST.b.identifier('event')],
            async: true,
            body: AST.b.blockStatement([
              AST.b.returnStatement(
                AST.b.objectExpression(
                  loaders.map((loader) =>
                    AST.b.spreadProperty(
                      AST.b.awaitExpression(
                        AST.b.callExpression.from({
                          callee: AST.b.identifier(loader),
                          arguments: [AST.b.identifier('event')],
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            ]),
          }),
        ),
      );

      return {
        code: AST.print(program),
        map: { mappings: '' },
      };
    },
  };
};
