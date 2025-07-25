// ESLint 9+ flat configuration
const js = require("@eslint/js");
const typescript = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");

module.exports = [
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        ignores: ["out/**", "node_modules/**", "dist/**", ".vscode-test/**"],
        languageOptions: {
            parser: typescriptParser,
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                console: "readonly",
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                process: "readonly",
                Buffer: "readonly",
                global: "readonly"
            }
        },
        plugins: {
            "@typescript-eslint": typescript
        },
        rules: {
            ...js.configs.recommended.rules,
            
            // TypeScript specific rules - more lenient for VS Code extension
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/no-require-imports": "off", // Allow require for VS Code extensions
            
            // General rules - more lenient
            "no-console": "off", // Allow console for VS Code extension development
            "no-unused-vars": "off", // Let TypeScript handle this
            "no-undef": "off", // TypeScript handles this better
            "prefer-const": "error",
            "no-var": "error",
            "eqeqeq": "error",
            "curly": "error",
            "brace-style": ["error", "1tbs"],
            "comma-dangle": "off", // More flexible
            "quotes": ["error", "single"],
            "semi": ["error", "always"],
            "indent": "off", // Disable strict indentation 
            "no-trailing-spaces": "off", // Disable for now
            "no-multiple-empty-lines": ["error", { "max": 3 }],
            "object-curly-spacing": ["error", "always"],
            "array-bracket-spacing": ["error", "never"],
            "space-before-function-paren": "off", // More flexible
            "keyword-spacing": "error"
        }
    },
    {
        files: ["**/*.test.ts", "**/*.spec.ts"],
        languageOptions: {
            globals: {
                suite: "readonly",
                test: "readonly",
                before: "readonly",
                after: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly"
            }
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "no-unused-expressions": "off"
        }
    }
];
