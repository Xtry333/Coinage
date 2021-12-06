# CoinageApp

Coinage is a personal project for keeping track of all expenses and incomes for multiple accounts.

It is based on Nx, written on Angular in TypeScript.

## Features

Currently Coinage supports limited features:

-   Run in dockerized environment (3 containers)
-   Run in development mode (no docker)
-   Possibility to add contractors
-   Possibility to add categories
-   Possibility to add transfers from and to contractors
-   Possibility to add multiple accounts (currently only through database)
-   Virtual accounts (currently only through database)
-   Dashboard with all accounts and their balances for active user, with short summary of all recent transfers
-   Overall monthly spendings and incomes
-   Receipts for expenses that are not yet paid or partially paid
-   Notifications
-   Internal transfers between accounts

## Planned features

Features planned for the future (far or near):

-   Possibility to add multiple currencies
-   Possibility to add create transactions across multiple currencies
-   Summarize all expenses and incomes for each contractor
-   Notify users about upcoming payments
-   Adding testing to every component

## Quick Start

```
yarn
yarn build
yarn docker:up
```

## Development server

```
yarn
yarn dev
```

## Creating a migration for SQL

```
yarn migration:create <migration_name>
```

## Formatting the codebase

```
yarn format
```
