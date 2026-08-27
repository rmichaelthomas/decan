#!/usr/bin/env node
import { runDecanCli } from "./commands.js";

process.exitCode = await runDecanCli(process.argv.slice(2));
