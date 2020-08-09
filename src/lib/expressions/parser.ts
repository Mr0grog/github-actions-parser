import * as chevrotain from "chevrotain";

///////
// Copy the content between here,

const True = chevrotain.createToken({ name: "True", pattern: /true/ });
const False = chevrotain.createToken({ name: "False", pattern: /false/ });
const Null = chevrotain.createToken({ name: "Null", pattern: /null/ });
const LParens = chevrotain.createToken({ name: "LParens", pattern: /\(/ });
const RParens = chevrotain.createToken({ name: "RParens", pattern: /\)/ });
const LSquare = chevrotain.createToken({ name: "LSquare", pattern: /\[/ });
const RSquare = chevrotain.createToken({ name: "RSquare", pattern: /]/ });
const Comma = chevrotain.createToken({ name: "Comma", pattern: /,/ });

/**
 * Expressions cannot use arbitrary variables, everything needs to be access via a context,
 * so define all supported ones.
 * see https://help.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#contexts
 */
export const Context = chevrotain.createToken({
  name: "Context",
  //pattern: /github|env|job|steps|runner|secrets|strategy|matrix|needs/,
  pattern: chevrotain.Lexer.NA,
});
export const Contexts = [
  "github",
  "env",
  "job",
  "steps",
  "runner",
  "secrets",
  "strategy",
  "matrix",
  "needs",
].map((c) =>
  chevrotain.createToken({
    name: `Context${c}`,
    pattern: new RegExp(`${c}`),
    categories: Context,
  })
);
export const Dot = chevrotain.createToken({ name: "Dot", pattern: /\./ });
export const ContextMember = chevrotain.createToken({
  name: "ContextMember",
  pattern: /[a-zA-Z_][a-zA-Z0-9-_]*/,
});

//
// Operators
//
export const Operator = chevrotain.createToken({
  name: "Operator",
  pattern: chevrotain.Lexer.NA,
});
export const And = chevrotain.createToken({
  name: "And",
  pattern: /&&/,
  categories: Operator,
});
export const Or = chevrotain.createToken({
  name: "Or",
  pattern: /\|\|/,
  categories: Operator,
});
export const Eq = chevrotain.createToken({
  name: "Eq",
  pattern: /==/,
  categories: Operator,
});
export const NEq = chevrotain.createToken({
  name: "NotEq",
  pattern: /!=/,
  categories: Operator,
});
export const LT = chevrotain.createToken({
  name: "LT",
  pattern: /</,
  categories: Operator,
});
export const LTE = chevrotain.createToken({
  name: "LTE",
  pattern: /<=/,
  categories: Operator,
});
export const GT = chevrotain.createToken({
  name: "GT",
  pattern: />/,
  categories: Operator,
});
export const GTE = chevrotain.createToken({
  name: "GTE",
  pattern: />=/,
  categories: Operator,
});
export const Not = chevrotain.createToken({
  name: "Not",
  pattern: /!/,
  categories: Operator,
});

//
// Functions
//
// TODO: Adding all functions as tokens might not be the best idea, but this way we get validation during parsing
export const Function = chevrotain.createToken({
  name: "Function",
  pattern: chevrotain.Lexer.NA,
});
export const contains = chevrotain.createToken({
  name: "contains",
  pattern: /contains/,
  categories: Function,
});
export const startsWith = chevrotain.createToken({
  name: "startsWith",
  pattern: /startsWith/,
  categories: Function,
});
export const endsWith = chevrotain.createToken({
  name: "endsWith",
  pattern: /endsWith/,
  categories: Function,
});
export const join = chevrotain.createToken({
  name: "join",
  pattern: /join/,
  categories: Function,
});
export const toJson = chevrotain.createToken({
  name: "toJson",
  pattern: /toJson/,
  categories: Function,
});
export const fromJson = chevrotain.createToken({
  name: "fromJson",
  pattern: /fromJson/,
  categories: Function,
});
export const hashFiles = chevrotain.createToken({
  name: "hashFiles",
  pattern: /hashFiles/,
  categories: Function,
});
export const success = chevrotain.createToken({
  name: "success",
  pattern: /success/,
  categories: Function,
});
export const always = chevrotain.createToken({
  name: "always",
  pattern: /always/,
  categories: Function,
});
export const failure = chevrotain.createToken({
  name: "failure",
  pattern: /failure/,
  categories: Function,
});
export const format = chevrotain.createToken({
  name: "format",
  pattern: /format/,
  categories: Function,
});
export const cancelled = chevrotain.createToken({
  name: "cancelled",
  pattern: /cancelled/,
  categories: Function,
});
const Functions = [
  contains,
  startsWith,
  endsWith,
  join,
  toJson,
  fromJson,
  hashFiles,
  success,
  always,
  failure,
  format,
  cancelled,
];

export const StringLiteral = chevrotain.createToken({
  name: "StringLiteral",
  //pattern: /'(:?[^'']|\\(:?[bfnrtv\\/]|u[0-9a-fA-F]{4}))*'/,
  pattern: /'((?:''|[^'])*)'/,
});
export const NumberLiteral = chevrotain.createToken({
  name: "NumberLiteral",
  pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
});
export const WhiteSpace = chevrotain.createToken({
  name: "WhiteSpace",
  pattern: /[ \t\n\r]+/,
  group: chevrotain.Lexer.SKIPPED,
});

const allTokens = [
  WhiteSpace,
  NumberLiteral,

  // Built-in functions
  Function,
  contains,
  startsWith,
  format,
  endsWith,
  join,
  toJson,
  fromJson,
  hashFiles,
  success,
  always,
  cancelled,
  failure,

  StringLiteral,
  LParens,
  RParens,
  LSquare,
  RSquare,
  Comma,

  // Operators
  Operator,
  And,
  Or,
  Eq,
  NEq,
  LTE,
  LT,
  GTE,
  GT,
  Not,

  // Literals
  True,
  False,
  Null,

  // Contexts (github, env, etc.)
  Context,
  ...Contexts,
  Dot,
  ContextMember,
];
const ExpressionLexer = new chevrotain.Lexer(allTokens);

export class ExpressionParser extends chevrotain.CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  expression = this.RULE("expression", () => {
    this.OPTION(() => {
      this.SUBRULE(this.subExpression, { LABEL: "lhs" });
      this.MANY(() => {
        this.CONSUME(Operator);
        this.SUBRULE2(this.subExpression, { LABEL: "rhs" });
      });
    });
  });

  subExpression = this.RULE("subExpression", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.logicalGrouping) },
      { ALT: () => this.SUBRULE(this.functionCall) },
      { ALT: () => this.SUBRULE(this.contextAccess) },
      { ALT: () => this.SUBRULE(this.value) },
      { ALT: () => this.SUBRULE(this.array) },
    ]);
  });

  contextAccess = this.RULE("contextAccess", () => {
    this.OR(
      Contexts.map((f) => ({
        ALT: () => this.CONSUME(f),
      }))
    );

    this.MANY(() => {
      this.SUBRULE(this.contextMember);
    });
  });

  contextMember = this.RULE("contextMember", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.contextDotMember) },
      { ALT: () => this.SUBRULE(this.contextBoxMember) },
    ]);
  });

  contextDotMember = this.RULE("contextDotMember", () => {
    this.CONSUME(Dot);
    this.CONSUME(ContextMember);
  });

  contextBoxMember = this.RULE("contextBoxMember", () => {
    this.CONSUME(LSquare);
    this.SUBRULE(this.subExpression);
    this.CONSUME(RSquare);
  });

  array = this.RULE("array", () => {
    this.CONSUME(LSquare);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE(this.subExpression);
      },
    });
    this.CONSUME(RSquare);
  });

  logicalGrouping = this.RULE("logicalGrouping", () => {
    this.CONSUME(LParens);
    this.SUBRULE(this.expression);
    this.CONSUME(RParens);
  });

  functionCall = this.RULE("functionCall", () => {
    // Consume one of the functions
    this.OR(
      Functions.map((f) => ({
        ALT: () => this.CONSUME(f),
      }))
    );

    // Parse parameters
    this.CONSUME(LParens);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE(this.expression);
      },
    });
    this.CONSUME(RParens);
  });

  value = this.RULE("value", () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.SUBRULE(this.booleanValue) },
      { ALT: () => this.CONSUME(Null) },
    ]);
  });

  booleanValue = this.RULE("booleanValue", () => {
    this.OPTION(() => this.CONSUME(Not));
    this.OR([
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
    ]);
  });
}

// return {
//   lexer: ExpressionLexer,
//   parser: ExpressionParser,
//   defaultRule: "expression",
// };
// and here to the playground for visualization.
//////////

// reuse the same parser instance.
export const defaultRule = "expression";
export const parser = new ExpressionParser();
export const BaseCstVisitor = parser.getBaseCstVisitorConstructor();
export { ExpressionLexer };
