## API documentation

API documentation can be generated with the [`apidoc`](https://www.npmjs.com/package/apidoc)

Install `apidoc`:

```bash
npm i -g apidoc
```

Generate the documentation:

```bash
npm run docs && npm run dev
```

Documentation will be available as static pages at http://localhost:2211 (your port may be different)

Documentation will only be available if application `ENV` is in `dev`, otherwise static pages will not be served by the server!

Please be careful!

**DO NOT** generate the documentation on the STAGE and PROD instances!

**DO NOT** remove the documentation directory (`docs`) from the [`.gitignore`](.gitignore) file!
