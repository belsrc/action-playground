# Play around with Github actions

##### General Check
```yml
name: build-check

on:
  pull_request:
    types: [opened, edited]
  push:
    branches:
      - master
      - develop
    paths-ignore:
      - 'docs/**'
      - '**.md'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Linter
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Unit Tests
        run: npm run test:cov

  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Build
        run: npm run build
```
