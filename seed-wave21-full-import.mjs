import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
const conn = await mysql.createConnection(DATABASE_URL);

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  WAVE 21 — FULL REAL DATA IMPORT FROM CLOUD PC             ║");
console.log("║  Community Tap & Pizza — Never 86'd Platform                ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// ============================================================
// SECTION 1: REAL DAY-SPECIFIC CHECKLISTS (Mon-Sun)
// From: 01-checklist-monday-sunday-waitstaff.txt (printed wall docs)
// ============================================================
console.log("\n━━━ SECTION 1: Day-Specific Checklists ━━━");

// Delete ALL existing day-specific bar/pizza checklists (IDs 90001-90022)
await conn.execute(`DELETE FROM checklists WHERE id >= 90001 AND id <= 90022`);
console.log("  Deleted old day-specific checklists (90001-90022)");

// MONDAY
const monAmBartender = [
  { task: "Get out all condiments on both sides", required: true, group: "Setup" },
  { task: "Get bus tub/silverware tub ready", required: true, group: "Setup" },
  { task: "Make pitchers of water", required: true, group: "Prep" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Stock coolers/overstock", required: true, group: "Stocking" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Trashes/Cans", required: true, group: "Cleaning" },
  { task: "Fill kids cups/lids/straws/plastic cups", required: true, group: "Stocking" },
  { task: "Empty slop bucket in kitchen", required: true, group: "Cleaning" },
  { task: "Deposit", required: true, group: "Cash" },
];

const monAmWaitstaff = [
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Make sure all tables are completely wiped off", required: true, group: "Cleaning" },
  { task: "Trashes/cans", required: true, group: "Cleaning" },
  { task: "Help fill coolers/walk in", required: true, group: "Stocking" },
  { task: "Restock any items that are low", required: true, group: "Stocking" },
  { task: "Explain all table transfers and tabs", required: true, group: "Handoff" },
];

const monPmBartender = [
  { task: "Wash & clean under all mats", required: true, group: "Bar Cleaning" },
  { task: "Wash waitress only and yuengling mats", required: true, group: "Bar Cleaning" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock coolers", required: true, group: "Stocking" },
  { task: "Stock pop", required: true, group: "Stocking" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Dump Slop bucket & wash", required: true, group: "Cleaning" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Fill ice in kitchen", required: true, group: "Ice" },
  { task: "Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)", required: true, group: "Bathrooms" },
  { task: "Take out trashes behind bar & waitress/refill liners/cans", required: true, group: "Trash" },
  { task: "Lock all doors", required: true, group: "Security" },
  { task: "Close out all computers", required: true, group: "Closing" },
  { task: "Turn off tvs/speaker down", required: true, group: "Closing" },
  { task: "Deposit/A.M. & P.M. kitchen tips", required: true, group: "Cash" },
  { task: "Make sure all doors are locked, air is right, set alarm", required: true, group: "Security" },
];

const monPmWaitstaff = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Check all fountain pop and replace all empty/almost empty", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

// TUESDAY
const tueAmBartender = [
  { task: "Get out all condiments on both sides", required: true, group: "Setup" },
  { task: "Get bus tub/silverware tub ready", required: true, group: "Setup" },
  { task: "Make pitchers of water", required: true, group: "Prep" },
  { task: "Stock walk in (Beer comes today)", required: true, group: "Stocking" },
  { task: "Stock coolers/overstock", required: true, group: "Stocking" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Trashes/Cans", required: true, group: "Cleaning" },
  { task: "Fill kids cups/lids/straws/plastic cups", required: true, group: "Stocking" },
  { task: "Empty slop bucket in kitchen", required: true, group: "Cleaning" },
  { task: "Deposit", required: true, group: "Cash" },
];

const tueAmWaitstaff = [
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Make sure all tables are completely wiped off", required: true, group: "Cleaning" },
  { task: "Trashes/cans", required: true, group: "Cleaning" },
  { task: "Help fill coolers/walk in", required: true, group: "Stocking" },
  { task: "Restock any items that are low", required: true, group: "Stocking" },
  { task: "Explain all table transfers and tabs", required: true, group: "Handoff" },
];

const tuePmBartender = [
  { task: "Wash & clean under all mats", required: true, group: "Bar Cleaning" },
  { task: "Wash waitress only and yuengling mats", required: true, group: "Bar Cleaning" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock coolers", required: true, group: "Stocking" },
  { task: "Stock pop", required: true, group: "Stocking" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Dump Slop bucket & wash", required: true, group: "Cleaning" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)", required: true, group: "Bathrooms" },
  { task: "Take out trashes behind bar & waitress/refill liners/cans", required: true, group: "Trash" },
  { task: "Lock all doors", required: true, group: "Security" },
  { task: "Close out all computers", required: true, group: "Closing" },
  { task: "Turn off tvs/speaker down", required: true, group: "Closing" },
  { task: "Deposit/A.M. & P.M. kitchen tips", required: true, group: "Cash" },
  { task: "Make sure all doors are locked, air is right, set alarm", required: true, group: "Security" },
];

const tuePmWaitstaff = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Check all fountain pop and replace all empty/almost empty", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

const tuePmPizzaSide = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Check all fountain pop and replace all empty/almost empty", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

// WEDNESDAY
const wedAmBartender = [
  { task: "Get out all condiments on both sides", required: true, group: "Setup" },
  { task: "Get bus tub/silverware tub ready", required: true, group: "Setup" },
  { task: "Make pitchers of water", required: true, group: "Prep" },
  { task: "Stock coolers/overstock", required: true, group: "Stocking" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Trashes/Cans", required: true, group: "Cleaning" },
  { task: "Fill kids cups/lids/straws/plastic cups", required: true, group: "Stocking" },
  { task: "Empty slop bucket in kitchen", required: true, group: "Cleaning" },
  { task: "Deposit", required: true, group: "Cash" },
];

const wedAmWaitstaff = [
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Make sure all tables are completely wiped off", required: true, group: "Cleaning" },
  { task: "Trashes/cans", required: true, group: "Cleaning" },
  { task: "Help fill coolers/walk in", required: true, group: "Stocking" },
  { task: "Restock any items that are low", required: true, group: "Stocking" },
  { task: "Explain all table transfers and tabs", required: true, group: "Handoff" },
];

const wedPmBartender = [
  { task: "Wash & clean under all mats", required: true, group: "Bar Cleaning" },
  { task: "Wash waitress only and yuengling mats", required: true, group: "Bar Cleaning" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock coolers", required: true, group: "Stocking" },
  { task: "Stock pop", required: true, group: "Stocking" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Dump Slop bucket & wash", required: true, group: "Cleaning" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)", required: true, group: "Bathrooms" },
  { task: "Take out trashes behind bar & waitress/refill liners/cans", required: true, group: "Trash" },
  { task: "Lock all doors", required: true, group: "Security" },
  { task: "Close out all computers", required: true, group: "Closing" },
  { task: "Turn off tvs/speaker down", required: true, group: "Closing" },
  { task: "Deposit/A.M. & P.M. kitchen tips", required: true, group: "Cash" },
  { task: "Make sure all doors are locked, air is right, set alarm", required: true, group: "Security" },
];

const wedPmWaitstaff = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill large & small togo boxes", required: true, group: "Stocking" },
  { task: "Clean coffee machine, refill bags, sugar & sugar packets, extra water pitchers", required: true, group: "Coffee Station" },
  { task: "Wipe off bus tub cart", required: true, group: "Cleaning" },
  { task: "Put up chairs & sweep", required: true, group: "Floors" },
  { task: "Mop and put stools down once dry", required: true, group: "Floors" },
  { task: "Buff floors", required: true, group: "Floors" },
];

const wedPmPizzaSide = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Check all fountain pop and replace all empty/almost empty", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

// THURSDAY
const thuAmBartender = [
  { task: "Get out all condiments on both sides", required: true, group: "Setup" },
  { task: "Get bus tub/silverware tub ready", required: true, group: "Setup" },
  { task: "Make pitchers of water", required: true, group: "Prep" },
  { task: "Stock coolers/overstock", required: true, group: "Stocking" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Trashes/Cans", required: true, group: "Cleaning" },
  { task: "Fill kids cups/lids/straws/plastic cups", required: true, group: "Stocking" },
  { task: "Empty slop bucket in kitchen", required: true, group: "Cleaning" },
  { task: "Deposit", required: true, group: "Cash" },
];

const thuAmWaitstaff = [
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Make sure all tables are completely wiped off", required: true, group: "Cleaning" },
  { task: "Trashes/cans", required: true, group: "Cleaning" },
  { task: "Help fill coolers/walk in", required: true, group: "Stocking" },
  { task: "Restock any items that are low", required: true, group: "Stocking" },
  { task: "Explain all table transfers and tabs", required: true, group: "Handoff" },
];

const thuPmBartender = [
  { task: "Wash & clean under all mats", required: true, group: "Bar Cleaning" },
  { task: "Wash waitress only and yuengling mats", required: true, group: "Bar Cleaning" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock coolers", required: true, group: "Stocking" },
  { task: "Stock pop", required: true, group: "Stocking" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Dump Slop bucket & wash", required: true, group: "Cleaning" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)", required: true, group: "Bathrooms" },
  { task: "Take out trashes behind bar & waitress/refill liners/cans", required: true, group: "Trash" },
  { task: "Lock all doors", required: true, group: "Security" },
  { task: "Close out all computers", required: true, group: "Closing" },
  { task: "Turn off tvs/speaker down", required: true, group: "Closing" },
  { task: "Deposit/A.M. & P.M. kitchen tips", required: true, group: "Cash" },
  { task: "Make sure all doors are locked, air is right, set alarm", required: true, group: "Security" },
];

const thuPmWaitstaff = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Check all fountain pop and replace all empty/almost empty", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

const thuPmPizzaSide = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Check all fountain pop and replace all empty/almost empty", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

// FRIDAY
const friAmBartender = [
  { task: "Get out all condiments on both sides", required: true, group: "Setup" },
  { task: "Get bus tub/silverware tub ready", required: true, group: "Setup" },
  { task: "Make pitchers of water", required: true, group: "Prep" },
  { task: "Stock walk in (Beer comes today)", required: true, group: "Stocking" },
  { task: "Cut fruit/extra for weekend", required: true, group: "Prep" },
  { task: "Stock coolers/overstock", required: true, group: "Stocking" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Trashes/Cans", required: true, group: "Cleaning" },
  { task: "Get extra mixers for barside", required: true, group: "Stocking" },
  { task: "Fill kids cups/lids/straws/plastic cups", required: true, group: "Stocking" },
  { task: "Empty slop bucket in kitchen", required: true, group: "Cleaning" },
  { task: "Deposit", required: true, group: "Cash" },
];

const friAmWaitstaff = [
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Make sure all tables are completely wiped off", required: true, group: "Cleaning" },
  { task: "Trashes/cans", required: true, group: "Cleaning" },
  { task: "Help fill coolers/walk in", required: true, group: "Stocking" },
  { task: "Restock any items that are low", required: true, group: "Stocking" },
  { task: "Explain all table transfers and tabs", required: true, group: "Handoff" },
];

const friPmBartender = [
  { task: "Wash & clean under all mats", required: true, group: "Bar Cleaning" },
  { task: "Wash waitress only and yuengling mats", required: true, group: "Bar Cleaning" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock coolers", required: true, group: "Stocking" },
  { task: "Stock pop", required: true, group: "Stocking" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Dump Slop bucket & wash", required: true, group: "Cleaning" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)", required: true, group: "Bathrooms" },
  { task: "Take out trashes behind bar & waitress/refill liners/cans", required: true, group: "Trash" },
  { task: "Lock all doors", required: true, group: "Security" },
  { task: "Close out all computers", required: true, group: "Closing" },
  { task: "Turn off tvs/speaker down", required: true, group: "Closing" },
  { task: "Deposit/A.M. & P.M. kitchen tips", required: true, group: "Cash" },
  { task: "Make sure all doors are locked, air is right, set alarm", required: true, group: "Security" },
];

const friPmWaitstaff = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill large & small togo boxes", required: true, group: "Stocking" },
  { task: "Clean coffee machine, refill bags, sugar & sugar packets, extra water pitchers", required: true, group: "Coffee Station" },
  { task: "Wipe off bus tub cart", required: true, group: "Cleaning" },
  { task: "Put up chairs & sweep", required: true, group: "Floors" },
  { task: "Mop and put stools down once dry", required: true, group: "Floors" },
];

const friPmPizzaSide = [
  { task: "Fill & clean BBQ sauce caddies", required: true, group: "Condiments" },
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Fill large & small togo boxes", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

// SATURDAY
const satAmBartender = [
  { task: "Get out all condiments on both sides", required: true, group: "Setup" },
  { task: "Get bus tub/silverware tub ready", required: true, group: "Setup" },
  { task: "Make pitchers of water", required: true, group: "Prep" },
  { task: "Stock coolers/overstock", required: true, group: "Stocking" },
  { task: "Fill Ice", required: true, group: "Ice" },
  { task: "Trashes/Cans", required: true, group: "Cleaning" },
  { task: "Empty slop bucket in kitchen", required: true, group: "Cleaning" },
  { task: "Deposit", required: true, group: "Cash" },
];

const satAmWaitstaff = [
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Make sure all tables are completely wiped off", required: true, group: "Cleaning" },
  { task: "Trashes/cans", required: true, group: "Cleaning" },
  { task: "Help fill coolers/walk in", required: true, group: "Stocking" },
  { task: "Restock any items that are low", required: true, group: "Stocking" },
  { task: "Explain all table transfers and tabs", required: true, group: "Handoff" },
];

const satAmPizzaSide = [
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Check fountain pop", required: true, group: "Stocking" },
  { task: "Fill any depleted items", required: true, group: "Stocking" },
];

const satPmBartender = [
  { task: "Wash & clean under all mats", required: true, group: "Bar Cleaning" },
  { task: "Wash waitress only and yuengling mats", required: true, group: "Bar Cleaning" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock coolers", required: true, group: "Stocking" },
  { task: "Stock pop", required: true, group: "Stocking" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Dump Slop bucket & wash", required: true, group: "Cleaning" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)", required: true, group: "Bathrooms" },
  { task: "Take out trashes behind bar & waitress/refill liners/cans", required: true, group: "Trash" },
  { task: "Lock all doors", required: true, group: "Security" },
  { task: "Close out all computers", required: true, group: "Closing" },
  { task: "Turn off tvs/speaker down", required: true, group: "Closing" },
  { task: "Deposit/A.M. & P.M. kitchen tips", required: true, group: "Cash" },
  { task: "Make sure all doors are locked, air is right, set alarm", required: true, group: "Security" },
];

const satPmWaitstaff = [
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill Parmesan containers", required: true, group: "Condiments" },
  { task: "Fill red pepperflake containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Wipe off bus tub cart", required: true, group: "Cleaning" },
  { task: "Clean coffee machine, refill bags, sugar & sugar packets, extra water pitchers", required: true, group: "Coffee Station" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Put up chairs & sweep", required: true, group: "Floors" },
  { task: "Mop and put stools down once dry", required: true, group: "Floors" },
];

const satPmPizzaSide = [
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Fill parmesan containers", required: true, group: "Condiments" },
  { task: "Fill red pepperflake containers", required: true, group: "Condiments" },
  { task: "Fill napkin holders", required: true, group: "Stocking" },
  { task: "Take apart pop machine, run through dishwasher, & soak tabs", required: true, group: "Deep Clean" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

// SUNDAY
const sunAmBartender = [
  { task: "Get out all condiments on both sides", required: true, group: "Setup" },
  { task: "Get bus tub/silverware tub ready", required: true, group: "Setup" },
  { task: "Make pitchers of water", required: true, group: "Prep" },
  { task: "Stock coolers/overstock", required: true, group: "Stocking" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Trashes/Cans", required: true, group: "Cleaning" },
  { task: "Empty slop bucket in kitchen", required: true, group: "Cleaning" },
  { task: "Deposit", required: true, group: "Cash" },
];

const sunAmWaitstaff = [
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Make sure all tables are completely wiped off", required: true, group: "Cleaning" },
  { task: "Trashes/cans", required: true, group: "Cleaning" },
  { task: "Help fill coolers/walk in", required: true, group: "Stocking" },
  { task: "Restock any items that are low", required: true, group: "Stocking" },
  { task: "Explain all table transfers and tabs", required: true, group: "Handoff" },
];

const sunAmPizzaSide = [
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Check fountain pop", required: true, group: "Stocking" },
  { task: "Fill any depleted items", required: true, group: "Stocking" },
];

const sunPmBartender = [
  { task: "Wash & clean under all mats", required: true, group: "Bar Cleaning" },
  { task: "Wash waitress only and yuengling mats", required: true, group: "Bar Cleaning" },
  { task: "Clean tops of wells and underneath liquor bottles", required: true, group: "Bar Cleaning" },
  { task: "Stock coolers", required: true, group: "Stocking" },
  { task: "Stock pop", required: true, group: "Stocking" },
  { task: "Stock walk in", required: true, group: "Stocking" },
  { task: "Dump Slop bucket & wash", required: true, group: "Cleaning" },
  { task: "Fill ice", required: true, group: "Ice" },
  { task: "Clean Bathrooms (Fill toilet paper/paper towels, clean toilets, ice urinals, and trashes)", required: true, group: "Bathrooms" },
  { task: "Take out trashes behind bar & waitress/refill liners/cans", required: true, group: "Trash" },
  { task: "Lock all doors", required: true, group: "Security" },
  { task: "Close out all computers", required: true, group: "Closing" },
  { task: "Turn off tvs/speaker down", required: true, group: "Closing" },
  { task: "Deposit/A.M. & P.M. kitchen tips", required: true, group: "Cash" },
  { task: "Make sure all doors are locked, air is right, set alarm", required: true, group: "Security" },
];

const sunPmWaitstaff = [
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Empty, clean, and refill parmesan containers", required: true, group: "Condiments" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Wipe off bus tub cart", required: true, group: "Cleaning" },
  { task: "Put up chairs & sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Buff floors & put down stools", required: true, group: "Floors" },
];

const sunPmPizzaSide = [
  { task: "Marry all ketchup & mustard", required: true, group: "Condiments" },
  { task: "Empty & clean parmesan containers (Start old Parm)", required: true, group: "Condiments" },
  { task: "Silverware", required: true, group: "Prep" },
  { task: "Wipe off pop machine and make sure cups and straws are stocked", required: true, group: "Stocking" },
  { task: "Check all fountain pop and replace all empty/almost empty", required: true, group: "Stocking" },
  { task: "Windex doors/turn off tvs/tables all wiped down", required: true, group: "Cleaning" },
  { task: "Sweep", required: true, group: "Floors" },
  { task: "Mop", required: true, group: "Floors" },
  { task: "Checkout", required: true, group: "Cash" },
];

// Morning Pizza Prep List (from Google Sheet)
const morningPizzaPrep = [
  { task: "Chopped onion (only half pan during week days)", required: true, group: "Prep" },
  { task: "Chopped green peppers (only half pan week days)", required: true, group: "Prep" },
  { task: "Sauce — 4 buckets all time is par", required: true, group: "Prep" },
  { task: "Black olives", required: true, group: "Prep" },
  { task: "Green olives", required: true, group: "Prep" },
  { task: "Pineapple", required: true, group: "Prep" },
  { task: "Sauerkraut", required: true, group: "Prep" },
  { task: "Chopped pickles", required: true, group: "Prep" },
  { task: "To go pickles portioned (6)", required: true, group: "Prep" },
  { task: "Crab base", required: true, group: "Prep" },
  { task: "Parm cheese (25 cups)", required: true, group: "Condiments" },
  { task: "Red peppers (25 cups)", required: true, group: "Condiments" },
  { task: "Taco sauce (25 cups)", required: true, group: "Condiments" },
  { task: "Make sure to go boxes are filled", required: true, group: "Stocking" },
  { task: "Fill sauce bottle", required: true, group: "Stocking" },
  { task: "Dough must be all rolled before you leave", required: true, group: "Dough" },
  { task: "Full taco sauce", required: true, group: "Prep" },
  { task: "Fill taco chips", required: true, group: "Prep" },
  { task: "Put dough away by 3pm", required: true, group: "Dough" },
  { task: "Check dough before clocking out", required: true, group: "Dough" },
  { task: "Clean pepsi cooler where dough goes", required: true, group: "Cleaning" },
  { task: "Windex the glass", required: true, group: "Cleaning" },
];

// Weekly Deep Clean Fry Line (Sun-Sat rotation)
const weeklyDeepClean = [
  { task: "Sunday: Change Foil on Stove", required: true, group: "Sunday" },
  { task: "Monday: Deep Freezer and Dry Storage", required: true, group: "Monday" },
  { task: "Tuesday: Deep Clean Steak Fridge And BBQ Fridge", required: true, group: "Tuesday" },
  { task: "Wednesday: Bleach wall behind Steam table", required: true, group: "Wednesday" },
  { task: "Thursday: Run stove tops thru dishwasher", required: true, group: "Thursday" },
  { task: "Friday: Clean up around smoker — dump bucket, sweep, clean the shelf and front", required: true, group: "Friday" },
  { task: "Saturday: Clean out bus tubs under charbroiler and seasoning shelf", required: true, group: "Saturday" },
];

// Pizza Nightly Closing (from printed sign)
const pizzaNightlyClosing = [
  { task: "Put dough away", required: true, group: "Dough" },
  { task: "Clean Dough roller", required: true, group: "Equipment" },
  { task: "Wipe out inside of cold table", required: true, group: "Cleaning" },
  { task: "Wipe down lids, doors and cold table", required: true, group: "Cleaning" },
  { task: "Stainless steel the dough wall", required: true, group: "Cleaning" },
  { task: "Stainless steel the prep table", required: true, group: "Cleaning" },
  { task: "Cover all dough", required: true, group: "Dough" },
  { task: "Take all utensils back to dish area", required: true, group: "Dishes" },
  { task: "Wipe down pizza table", required: true, group: "Cleaning" },
  { task: "Turn pizza ovens off", required: true, group: "Equipment" },
  { task: "Put cheese away", required: true, group: "Food Storage" },
  { task: "Windex both pepsi coolers", required: true, group: "Cleaning" },
  { task: "Shut hoods off", required: true, group: "Equipment" },
  { task: "Sweep and mop pizza side and store room", required: true, group: "Floors" },
  { task: "Fill pepsi cooler with cheese", required: true, group: "Stocking" },
  { task: "Bleach and scrub the sides of the trash can", required: true, group: "Cleaning" },
  { task: "Fill all sauce bottles (Ranch, BBQ, WOW, 1000, Buffalo, SC)", required: true, group: "Stocking" },
  { task: "Fill pepsi cooler with beef and sausage", required: true, group: "Stocking" },
  { task: "Make sure pizza line is fully stocked up top", required: true, group: "Stocking" },
  { task: "Pull out the pizza line and swipe behind it", required: true, group: "Cleaning" },
  { task: "Wipe down shelves", required: true, group: "Cleaning" },
  { task: "Put phones back on charger", required: true, group: "Closing" },
  { task: "Clean computer screens and counter", required: true, group: "Closing" },
];

// Insert all day-specific checklists
const allChecklists = [
  // Monday
  { name: "Bar — Mon AM Bartender", dept: "bar", type: "opening", items: monAmBartender, day: "Monday" },
  { name: "Bar — Mon AM Waitstaff", dept: "bar", type: "opening", items: monAmWaitstaff, day: "Monday" },
  { name: "Bar — Mon PM Bartender", dept: "bar", type: "closing", items: monPmBartender, day: "Monday" },
  { name: "Bar — Mon PM Waitstaff", dept: "bar", type: "closing", items: monPmWaitstaff, day: "Monday" },
  // Tuesday
  { name: "Bar — Tue AM Bartender", dept: "bar", type: "opening", items: tueAmBartender, day: "Tuesday" },
  { name: "Bar — Tue AM Waitstaff", dept: "bar", type: "opening", items: tueAmWaitstaff, day: "Tuesday" },
  { name: "Bar — Tue PM Bartender", dept: "bar", type: "closing", items: tuePmBartender, day: "Tuesday" },
  { name: "Bar — Tue PM Waitstaff", dept: "bar", type: "closing", items: tuePmWaitstaff, day: "Tuesday" },
  { name: "Pizza Side — Tue PM Closing", dept: "pizza_side", type: "closing", items: tuePmPizzaSide, day: "Tuesday" },
  // Wednesday
  { name: "Bar — Wed AM Bartender", dept: "bar", type: "opening", items: wedAmBartender, day: "Wednesday" },
  { name: "Bar — Wed AM Waitstaff", dept: "bar", type: "opening", items: wedAmWaitstaff, day: "Wednesday" },
  { name: "Bar — Wed PM Bartender", dept: "bar", type: "closing", items: wedPmBartender, day: "Wednesday" },
  { name: "Bar — Wed PM Waitstaff (Buff Night)", dept: "bar", type: "closing", items: wedPmWaitstaff, day: "Wednesday" },
  { name: "Pizza Side — Wed PM Closing", dept: "pizza_side", type: "closing", items: wedPmPizzaSide, day: "Wednesday" },
  // Thursday
  { name: "Bar — Thu AM Bartender", dept: "bar", type: "opening", items: thuAmBartender, day: "Thursday" },
  { name: "Bar — Thu AM Waitstaff", dept: "bar", type: "opening", items: thuAmWaitstaff, day: "Thursday" },
  { name: "Bar — Thu PM Bartender", dept: "bar", type: "closing", items: thuPmBartender, day: "Thursday" },
  { name: "Bar — Thu PM Waitstaff", dept: "bar", type: "closing", items: thuPmWaitstaff, day: "Thursday" },
  { name: "Pizza Side — Thu PM Closing", dept: "pizza_side", type: "closing", items: thuPmPizzaSide, day: "Thursday" },
  // Friday
  { name: "Bar — Fri AM Bartender", dept: "bar", type: "opening", items: friAmBartender, day: "Friday" },
  { name: "Bar — Fri AM Waitstaff", dept: "bar", type: "opening", items: friAmWaitstaff, day: "Friday" },
  { name: "Bar — Fri PM Bartender", dept: "bar", type: "closing", items: friPmBartender, day: "Friday" },
  { name: "Bar — Fri PM Waitstaff", dept: "bar", type: "closing", items: friPmWaitstaff, day: "Friday" },
  { name: "Pizza Side — Fri PM Closing", dept: "pizza_side", type: "closing", items: friPmPizzaSide, day: "Friday" },
  // Saturday
  { name: "Bar — Sat AM Bartender", dept: "bar", type: "opening", items: satAmBartender, day: "Saturday" },
  { name: "Bar — Sat AM Waitstaff", dept: "bar", type: "opening", items: satAmWaitstaff, day: "Saturday" },
  { name: "Pizza Side — Sat AM Opening", dept: "pizza_side", type: "opening", items: satAmPizzaSide, day: "Saturday" },
  { name: "Bar — Sat PM Bartender", dept: "bar", type: "closing", items: satPmBartender, day: "Saturday" },
  { name: "Bar — Sat PM Waitstaff", dept: "bar", type: "closing", items: satPmWaitstaff, day: "Saturday" },
  { name: "Pizza Side — Sat PM Closing", dept: "pizza_side", type: "closing", items: satPmPizzaSide, day: "Saturday" },
  // Sunday
  { name: "Bar — Sun AM Bartender", dept: "bar", type: "opening", items: sunAmBartender, day: "Sunday" },
  { name: "Bar — Sun AM Waitstaff", dept: "bar", type: "opening", items: sunAmWaitstaff, day: "Sunday" },
  { name: "Pizza Side — Sun AM Opening", dept: "pizza_side", type: "opening", items: sunAmPizzaSide, day: "Sunday" },
  { name: "Bar — Sun PM Bartender", dept: "bar", type: "closing", items: sunPmBartender, day: "Sunday" },
  { name: "Bar — Sun PM Waitstaff (Buff Night)", dept: "bar", type: "closing", items: sunPmWaitstaff, day: "Sunday" },
  { name: "Pizza Side — Sun PM Closing", dept: "pizza_side", type: "closing", items: sunPmPizzaSide, day: "Sunday" },
  // Non-day-specific additions
  { name: "Morning Pizza Prep List", dept: "pizza_side", type: "opening", items: morningPizzaPrep, day: null },
  { name: "Pizza Nightly Closing (Initialed)", dept: "pizza_side", type: "closing", items: pizzaNightlyClosing, day: null },
  { name: "Weekly Deep Clean — Fry Line AM", dept: "kitchen_line", type: "weekly", items: weeklyDeepClean, day: null },
];

// Also delete existing generic pizza opening/closing that conflict
await conn.execute(`DELETE FROM checklists WHERE name = 'Morning Pizza Prep List'`);
await conn.execute(`DELETE FROM checklists WHERE name = 'Pizza Nightly Closing (Initialed)'`);
await conn.execute(`DELETE FROM checklists WHERE name = 'Weekly Deep Clean — Fry Line AM'`);

let checklistCount = 0;
for (const cl of allChecklists) {
  await conn.execute(
    `INSERT INTO checklists (name, department, type, items, dayOfWeek) VALUES (?, ?, ?, ?, ?)`,
    [cl.name, cl.dept, cl.type, JSON.stringify(cl.items), cl.day]
  );
  checklistCount++;
}
console.log(`  ✓ Inserted ${checklistCount} real day-specific checklists`);

// Also add Closing Manager expectations as a checklist
await conn.execute(`DELETE FROM checklists WHERE name LIKE '%Closing Manager%'`);
const closingManagerItems = [
  { task: "Be the LAST one to punch out at end of night", required: true, group: "Protocol" },
  { task: "Walk through and check all closers before they leave", required: true, group: "Verification" },
  { task: "Walk through again before you leave for the night", required: true, group: "Verification" },
  { task: "Make sure no one else is in the building", required: true, group: "Security" },
  { task: "Arm the alarm (except Sun & Wed when FOH buffs floors)", required: true, group: "Security" },
  { task: "Verify all doors are locked before leaving", required: true, group: "Security" },
];
await conn.execute(
  `INSERT INTO checklists (name, department, type, items, dayOfWeek) VALUES (?, ?, ?, ?, ?)`,
  ["Closing Manager Expectations", "management", "closing", JSON.stringify(closingManagerItems), null]
);
console.log("  ✓ Inserted Closing Manager Expectations checklist");

console.log("\n━━━ SECTION 1 COMPLETE ━━━\n");

// ============================================================
// SECTION 2: SKU CATALOG — 117 PFG Food SKUs + 48 Iowa ABD Liquor
// ============================================================
console.log("\n━━━ SECTION 2: SKU Catalog (Real Vendor Products) ━━━");

const masterSkus = JSON.parse(fs.readFileSync('/home/ubuntu/cloud-pc-data/master_skus.json', 'utf8'));
const liquorItems = JSON.parse(fs.readFileSync('/home/ubuntu/cloud-pc-data/liquor.json', 'utf8'));

// Clear existing SKU catalog and re-seed with real data
await conn.execute(`DELETE FROM sku_catalog`);
console.log("  Cleared existing SKU catalog");

let skuCount = 0;
for (const [key, sku] of Object.entries(masterSkus)) {
  const price = sku.prices && sku.prices[0] ? sku.prices[0].replace('/lb', '') : null;
  const orderDate = sku.order_dates && sku.order_dates[0] ? sku.order_dates[0] : null;
  // Map category to our schema
  const catMap = {
    'CHEESE': 'dairy', 'PIZZA SUPPLIES': 'supplies', 'PAPER/SUPPLIES': 'supplies',
    'BREAD/DOUGH': 'bread', 'MEAT/PROTEIN': 'meat', 'PRODUCE': 'produce',
    'OTHER': 'dry_goods', 'CONDIMENTS': 'dry_goods', 'FROZEN': 'frozen', 'DAIRY': 'dairy'
  };
  const category = catMap[sku.category] || 'dry_goods';
  
  await conn.execute(
    `INSERT INTO sku_catalog (sku, productName, vendorName, category, unitSize, unitOfMeasure, lastOrderPrice, lastOrderDate, isActive, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, ?)`,
    [
      sku.sku,
      sku.product,
      sku.vendor || 'PFG',
      category,
      sku.pack_size,
      sku.unit || 'CS',
      price ? parseFloat(price) : null,
      orderDate ? new Date(`20${orderDate.split('/')[2]}/${orderDate.split('/')[0]}/${orderDate.split('/')[1]}`) : null,
      `Brand: ${sku.brand || 'N/A'} | PFG Category: ${sku.category}`
    ]
  );
  skuCount++;
}
console.log(`  ✓ Inserted ${skuCount} PFG food SKUs`);

// Now insert 48 Iowa ABD liquor items
let liquorCount = 0;
for (const item of liquorItems) {
  await conn.execute(
    `INSERT INTO sku_catalog (sku, productName, vendorName, category, unitSize, unitOfMeasure, lastOrderPrice, isActive, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, true, ?)`,
    [
      item.iowa_item,
      item.display_name,
      'Iowa ABD / Hy-Vee Wine & Spirits',
      'liquor',
      `${item.volume_ml}ml`,
      'bottle',
      parseFloat(item.state_bottle_retail),
      `Category: ${item.category} | Proof: ${item.proof} | State Cost: $${item.state_bottle_cost} | Case Cost: $${item.state_case_cost} | Pack: ${item.pack} | Vendor: ${item.vendor}`
    ]
  );
  liquorCount++;
}
console.log(`  ✓ Inserted ${liquorCount} Iowa ABD liquor items`);

console.log("\n━━━ SECTION 2 COMPLETE ━━━\n");

// ============================================================
// SECTION 3: FULL 743-ITEM POS MENU
// ============================================================
console.log("\n━━━ SECTION 3: Full POS Menu (743 items) ━━━");

const menuItemsData = JSON.parse(fs.readFileSync('/home/ubuntu/cloud-pc-data/menu.json', 'utf8'));

// Clear existing menu items and re-seed with full POS data
await conn.execute(`DELETE FROM menu_items`);
console.log("  Cleared existing menu items");

// Map POS groups to our category schema
const groupCatMap = {
  'System': 'food', 'Appetizers': 'food', 'Salads': 'food', 'Burgers': 'food',
  'Sandwiches': 'food', 'Toasted Subs': 'food', 'Wraps': 'food',
  'Steaks N More': 'food', 'Pasta': 'food', 'Sides': 'food',
  'Pizza': 'food', 'South of the Border': 'food', 'Baskets': 'food',
  'Kids Menu': 'food', 'Alcohol': 'liquor', 'BBQ': 'food',
  'Desserts': 'food', 'Breakfast': 'food', 'Specials': 'food'
};

let menuCount = 0;
for (const item of menuItemsData) {
  const cat = groupCatMap[item.group_name] || 'food';
  // Separate beer from liquor in Alcohol group
  const subcategory = item.group_name === 'Alcohol' ? 
    (item.name.toLowerCase().includes('draft') || item.name.toLowerCase().includes('bottle') || 
     item.name.toLowerCase().includes('can') || item.name.toLowerCase().includes('pint') ?
     'beer' : 'cocktail') : 
    item.group_name.toLowerCase().replace(/ /g, '_');
  
  await conn.execute(
    `INSERT INTO menu_items (posItemName, menuPrice, category, subcategory, isActive) VALUES (?, ?, ?, ?, true)`,
    [item.name, item.price, cat, subcategory, ]
  );
  menuCount++;
}
console.log(`  ✓ Inserted ${menuCount} POS menu items`);

console.log("\n━━━ SECTION 3 COMPLETE ━━━\n");

// ============================================================
// SECTION 4: KNOWLEDGE BASE — ALL SOPs & TRAINING DATA
// ============================================================
console.log("\n━━━ SECTION 4: Knowledge Base (SOPs, Training, Vendor Data) ━━━");

const knowledgeEntries = [
  // === DELIVERY DRIVER EXPECTATIONS ===
  {
    station: "general", category: "process",
    question: "What are the delivery driver expectations and responsibilities?",
    answer: "Being a driver isn't just about dropping off food — it's about being a reliable part of the team. Responsibilities: Sweep the parking lot if asked. Put in DoorDash tickets. Keep the dish pit clean — rinse, stack, and help when needed. Take out the trash — don't leave it for the next guy. When you return from a delivery, come back inside immediately — NO sitting in your car or stalling for 5-10 minutes. Answer the phones when you're not out on a run. Help with basic kitchen tasks — we all chip in. After mopping at night, take off the dirty mop head — we always have enough clean ones, use a fresh one every shift.",
    tags: ["driver", "expectations", "responsibilities", "dish pit", "trash", "phones"]
  },
  // === DAILY BAR SUPPLY ORDER ===
  {
    station: "bar", category: "process",
    question: "What is the daily bar supply order list and how does it work?",
    answer: "The daily bar supply order must be checked DAILY. One bartender is in charge of going to the store, but ALL bartenders need to check what's needed and write it in the book or call/text that bartender. ORDER WHEN LESS THAN HALF. Items: Arm & Hammer Pods (3), Unscented Dryer Sheets (2), Anderson Ericson 2% Chocolate Milk (3), Hy-Vee 2% White Milk (3), OJ carton (3), Cranberry Juice (3), Apple Juice (2), Cloves (2), Beef Sticks (2), Half and Half (2), Unscented Hand soap refill (2), Bitters (2), Espresso pods (5 containers @ Target), Chamoy (2), Starbucks Cold Brew (1), Cookie Straws (2), Pink Sugar, Blueberries, Strawberry Sour Patch Gummies, Powerade. Seasonal items change with drink menu.",
    tags: ["bar", "order", "supplies", "daily", "par levels", "store run"]
  },
  {
    station: "bar", category: "recipe",
    question: "How do you make the homemade syrups for the bar?",
    answer: "Simple Syrup: 4 cups water + 4 cups sugar, bring to a boil, turn off as soon as it starts to boil. Makes enough for 2 squeeze bottles. Brown Sugar Syrup: 2 cups brown sugar + 2 cups water, turn off as soon as it starts to boil. Blueberry Syrup: One container blueberries + 2 cups sugar + 2 cups water, turn off as soon as it starts to boil. These syrups need to be stocked each day — if you are the bartender that shift then you are in charge of making it.",
    tags: ["bar", "syrup", "simple syrup", "brown sugar", "blueberry", "recipe", "homemade"]
  },
  {
    station: "bar", category: "vendor",
    question: "What items does Alma need to order online for the bar?",
    answer: "These items need to be ordered online with plenty of time for shipping: Dried Pineapple, Dried Limes, Dried Orange, Dried Banana, Boba, Filthy Cherries, Big Bottle of Bitters, Cucumber Syrup, Walnut Bitters, Large Bag Cinnamon Sticks. Inform Alma with plenty of time to order since they come by mail.",
    tags: ["bar", "online order", "alma", "garnish", "bitters", "dried fruit"]
  },
  // === PREP WEIGHTS CHART ===
  {
    station: "general", category: "prep",
    question: "What are the correct prep weights for portioning?",
    answer: "Corned Beef and Turkey: 2oz. Asparagus: 3oz. Crab: 2oz. All Noodles: 5oz. Roasted Veggies: 5oz. Twice Bakes: 8.5oz. Cavs (cavaliers): 10oz. These weights are non-negotiable — use the scale every time.",
    tags: ["weights", "portions", "prep", "corned beef", "turkey", "asparagus", "crab", "noodles", "veggies", "twice bakes"]
  },
  // === BBQ WEIGHTS & SPECS ===
  {
    station: "general", category: "prep",
    question: "What are the correct BBQ portion weights for dinners, sandwiches, melts, and family packs?",
    answer: "BBQ Dinners: Dinner 1 = 8oz of meat. Dinner 2 = 4oz of each meat. Dinner 3 = 4oz of each meat. BBQ Sandwiches: 5oz of meat. BBQ Melts: 6oz of meat. Family Packs: Pack 1 = 1 pound meat + 2 pint cups + 4 cornbread. Pack 2 = 2 pounds meat + 3 pint cups + 6 cornbread. Pack 3 = 3 pounds meat + 4 pint cups + 8 cornbread.",
    tags: ["bbq", "weights", "portions", "dinner", "sandwich", "melt", "family pack", "cornbread"]
  },
  // === KITCHEN MANAGER ROLE ===
  {
    station: "general", category: "process",
    question: "What are the Kitchen Manager's duties and responsibilities?",
    answer: "Kitchen Manager accomplishes staff results by communicating job expectations; planning, monitoring, and appraising job results; coaching, counseling, and disciplining employees; initiating, coordinating, and enforcing systems, policies, and procedures. Duties include but not limited to: Weekly Product Order, Maintaining Proper Product Rotation, Maintaining a Clean/Sanitary Work Environment, Providing/Maintaining a Positive Work Environment, Maintaining Labor Costs/Effectively Managing Labor, Overseeing Proper Scheduling/Use of Labor Force, Overseeing Correct Prep Procedures/Coaching for Consistency, Overseeing Training of New Employees, Overseeing ReTraining on New Procedures/Items, Maintaining Supply of Small Wares/Plates/Utensils, Maintaining Equipment/Overseeing Scheduled Maintenance, Maintaining/Overseeing Proper Food Cost/Portion Control/Usage.",
    tags: ["kitchen manager", "tom", "duties", "responsibilities", "labor", "training", "food cost", "scheduling"]
  },
  // === BAR MANAGER ROLE ===
  {
    station: "bar", category: "process",
    question: "What are the Bar Manager's duties and responsibilities?",
    answer: "Bar Manager duties include but not limited to: INVENTORY MANAGEMENT — Liquor, Wine, Beer, Bitters, Cinnamon Sticks, Cloves, Stir Sticks, Picks, Glassware, Bar Washer Chemicals, Shakers/Jiggers. DRINK MENUS — Keep up to date drink menu with new drinks changed on quarterly schedule, keep up to date chalk board with new beers/drinks on daily schedule. STAFF KNOWLEDGE/TRAINING — Up to date lists of beer/wine for staff reference, Tests/Quizzes on beers/wines for staff knowledge. BEER COOLER — Cases and Wine organized in designated areas, Kegs on shelves or own area, Cleaning schedule for beer cooler. PRODUCT ROTATION — Ensure proper rotation during stocking. MANAGING OTHER BARTENDERS — Ensuring cleaning/stocking done correctly on other shifts, ensuring others know about new beers/drinks/wine. MAINTAINING CLEAN/ORGANIZED BAR — Bar cleaning schedule, weekly maintenance of bar equipment.",
    tags: ["bar manager", "ashley", "duties", "inventory", "drink menu", "training", "beer cooler", "staff"]
  },
  // === KITCHEN PROTOCOL (FINAL WARNING) ===
  {
    station: "general", category: "safety",
    question: "What is the kitchen protocol about being outside and what are the consequences?",
    answer: "OUTSIDE POLICY — The ONLY reasons you should be outside: 1) Smoke break (NOT during 11am-2pm or 5pm-9pm). 2) Taking out the trash. 3) Checking the smoker. 4) Bringing in a delivery. 5) Putting up or taking down the sign. That's the list. Nothing else counts. If there is no food task, no cleaning task, and no sign task — you belong inside this building. CONSEQUENCE: If Michael Mueller pulls into the parking lot and sees you outside for any reason other than those five — immediate termination. No warning. No second chance.",
    tags: ["outside", "protocol", "termination", "smoke break", "rules", "michael"]
  },
  {
    station: "general", category: "process",
    question: "What is the BBQ handling protocol?",
    answer: "BBQ HANDLING — EFFECTIVE IMMEDIATELY: BBQ does not sit in the smoker. The moment it's done: 1) Pull it off the smoker immediately. 2) Bring it straight to the wood table. 3) Wrap it properly. 4) Put it away in its correct spot. No more leaving it in the smoker. Not for five minutes, not while you 'finish something up', not because it's slow. Off the smoker → wood table → wrapped → put away. Period. Same consequence as outside policy: immediate termination if caught not doing this.",
    tags: ["bbq", "smoker", "handling", "protocol", "wrap", "wood table", "termination"]
  },
  {
    station: "general", category: "process",
    question: "What is the driver dish and reimbursement policy?",
    answer: "DRIVERS — DISHES: Between runs, you are on dishes. That is your side work. Not your phone, not standing out back, not hanging out. Dishes from deliveries get handled properly — brought in, rinsed, and into the dish pit. They do not sit in your car, on the counter, or get dumped and walked away from. DRIVER SHEET = YOUR REIMBURSEMENT: If you expect a cash reimbursement, you need to fill out the driver sheet. Period. No sheet = no reimbursement. This is not something we chase you about. Fill it out every shift — that's how you get paid back.",
    tags: ["driver", "dishes", "reimbursement", "driver sheet", "dish pit", "policy"]
  },
  // === KITCHEN STAFF RULES ===
  {
    station: "general", category: "safety",
    question: "What are the kitchen staff smoke break rules?",
    answer: "No Smoke Breaks Between 11am-2pm and 5pm-9pm. These are rush hours and all hands must be on deck. Outside of those windows, smoke breaks are permitted but keep them brief.",
    tags: ["smoke break", "rules", "kitchen", "rush hours", "11am", "5pm"]
  },
  // === DRESS CODE ===
  {
    station: "general", category: "process",
    question: "What is the employee dress code at CTap?",
    answer: "Employee Dress Code (Effective November 6): 1) Proper Attire Required — Sweatpants, basketball shorts, and jeans with holes are NOT permitted while on shift. 2) CTap Shirt Requirement — All employees must wear a CTap shirt during their shift. If you don't have one or need help purchasing, we'll provide it and can arrange payroll deduction. 3) Hat Policy — If wearing a hat, it must be worn facing forward at all times. 4) No Headphones — Headphones are not permitted during shifts to ensure full attention to tasks and customer service.",
    tags: ["dress code", "uniform", "ctap shirt", "hat", "headphones", "attire", "policy"]
  },
  // === NIGHTLY DRIVERS PAPERWORK ===
  {
    station: "general", category: "process",
    question: "What are the out-of-town delivery fees for drivers?",
    answer: "Out-of-town delivery fees (driver reimbursement): Quality Inn = $1, Kock = $8, CJ & Cargil = $5, Coalville = $5, Deerwood/Nathan/Luke = $5. These must be recorded on the driver sheet every shift to receive reimbursement.",
    tags: ["driver", "out of town", "fees", "reimbursement", "quality inn", "coalville", "kock"]
  },
  // === EMPLOYEE FOOD POLICY ===
  {
    station: "general", category: "process",
    question: "What is the employee food/eating policy?",
    answer: "You may eat a half hour before your shift or after your shift at HALF OFF. There is to be NO eating during rush times of 11am-2pm and 5pm-8pm. You may NOT ring in or make your own food. Managers/Bartenders will ring in, apply your discount, and cash you out. Managers will use their discretion on late night orders and sometimes you may be required to get your order to go. The half off policy is for EMPLOYEES ONLY and NOT for family and friends. Write ups will be given to those who fail to comply.",
    tags: ["employee food", "eating", "discount", "half off", "policy", "rush hours", "write up"]
  },
  // === VENDOR RELATIONSHIPS ===
  {
    station: "general", category: "vendor",
    question: "Who are CTAP's main food and supply vendors and when do they deliver?",
    answer: "PFG (Performance Food Group): Primary food vendor. Orders Mon & Thu, delivery Tue & Fri. Account #06528, Rep: Steve. CustomerFirst platform for ordering. Sysco: Secondary/specialty vendor. Orders as-needed. Sysco Shop platform, Perks points program. GF Crust SKU 7278698. Hy-Vee: Grocery backup + liquor. Wednesday AM pickup for bar supplies (Wine & Spirits section). Also produce/dairy backup. Hume's: Local meat supplier (specialty cuts). Fort Dodge Distributing: MillerCoors + imports beer. Johnson Brothers: Wine distributor. DMB/Budweiser: Bud/Busch/Michelob distributor.",
    tags: ["vendors", "pfg", "sysco", "hy-vee", "humes", "fort dodge distributing", "johnson brothers", "delivery schedule"]
  },
  {
    station: "general", category: "vendor",
    question: "What is the PFG ordering schedule and process?",
    answer: "PFG orders twice weekly: Monday order (Tuesday delivery) and Thursday order (Friday delivery). Account #06528, Rep: Steve. Use CustomerFirst platform. Monday Order: Walk the walk-in cooler, freezer, and dry storage. Check cheese levels (mozzarella block is #1 priority), meat inventory (burger patties, bacon, chicken strips), pizza supplies (boxes, circles, sauce), produce (lettuce, tomato, onion, peppers), fryer items (fries, apps), paper goods (gloves, liners, napkins), oil levels. Thursday Order: Same walk but also check weekend prep needs — double-check ribeye/porterhouse for weekend steak specials, extra pizza dough flour for Fri/Sat volume, extra fry oil for weekend volume, shrimp/fish for weekend baskets.",
    tags: ["pfg", "ordering", "monday", "thursday", "walk-in", "cheese", "mozzarella", "delivery"]
  },
  // === TOM'S FOOD ORDER GUIDE (KEY ITEMS) ===
  {
    station: "general", category: "vendor",
    question: "What are the key PFG items and their weekly par levels?",
    answer: "TOP PRIORITY ITEMS (PFG): Mozzarella Block (Roma 8/6 Lb) — 2-3 CS/week, #1 priority. Burger Patties (Angus 6oz) — 2-3 CS. Chicken Strips (Breaded) — 2-3 CS. Bacon Topping (Roma 2/5 Lb) — 1-2 CS. Wings (West Creek 4/10 Lb Jumbo) — 1 CS. Pizza Sauce (San Benito 6/#10 Can) — 2-4 CS. Waffle Fries — 3-5 CS. French Fries (Straight Cut 3/8\") — 2-3 CS. Fryer Oil (Soy Clear 1/35 Lb) — 2-4 CS. Lettuce Iceberg Shredded — 1 CS. Tomato Diced — 1-2 CS. Onion Yellow Diced — 1-2 CS. Green Peppers — 2 CS. Gloves Nitrile XL — 1 CS. Can Liners Black — 1 CS. Napkins — 1 CS.",
    tags: ["pfg", "par levels", "mozzarella", "burger", "chicken", "wings", "fries", "oil", "order guide", "tom"]
  },
  // === ASHLEY'S BAR ORDER GUIDE (KEY ITEMS) ===
  {
    station: "bar", category: "vendor",
    question: "What are the well liquor brands and weekly par levels?",
    answer: "WELL LIQUORS (from Hy-Vee Wine & Spirits, Wednesday call-in): Absolut Vodka (well) — Priority 1. Bacardi Superior (well rum) — Priority 1. Captain Morgan (most popular rum) — Priority 1. Jose Cuervo (well tequila, margaritas) — Priority 1. Fireball (shot volume) — Priority 1. Makers Mark (well bourbon) — Priority 1. Jameson (Irish whiskey) — Priority 1. Priority 2 (check levels): Absolut Citron/Mango, Malibu, Kahlua + Baileys (always paired), Southern Comfort, Rumchata, Triple Sec (margarita volume), Tanqueray (well gin). Priority 3 (monthly): All schnapps, all cremes, specialty (Chambord, Frangelico, Drambuie, Galliano), Moonshine, Bitters.",
    tags: ["bar", "liquor", "well", "hy-vee", "wednesday", "order", "ashley", "vodka", "rum", "bourbon"]
  },
  {
    station: "bar", category: "vendor",
    question: "What beer brands does CTap carry and from which distributors?",
    answer: "DMB/BUDWEISER: Bud Light Bottle (2-3 CS), Busch Light Bottle (2-3 CS), Ultra Light Can (2-3 CS), Ultra Bottle (1-2 CS), Cactus Lime Ultra (1 CS), Busch N/A (1 CS), Busch Lime (1 CS), Carbliss Watermelon/Cranberry/Pineapple/Black Raspberry ($7/24pk, 1-2 CS each). FORT DODGE DISTRIBUTING: Coors Light Bottle (2-3 CS), Coors Light Draft (1-2 keg), Miller Light Bottle (2-3 CS), Miller High Life (1 CS), Blue Moon (1 keg), White Claw Black Cherry/Mango/Lime ($5/24pk, 1-2 CS), Corona (1-2 CS), Stella (1 CS), Heineken (1 CS), Guinness (1 CS), Angry Orchard (1 CS), Smirnoff Ice (1 CS). SKIMMER: Half & Half, Original, Peach, Lemonade ($6/24pk, 1 CS each).",
    tags: ["beer", "distributors", "dmb", "budweiser", "fort dodge", "coors", "miller", "corona", "white claw", "carbliss"]
  },
  {
    station: "bar", category: "vendor",
    question: "What is the pour cost calculation and target for the bar?",
    answer: "Iowa controls all liquor pricing — you pay the same as everyone else. The margin is in POUR CONTROL and PRICING. Example: Absolut 750ml = $13.49 retail. 750ml = ~17 standard 1.5oz pours. Cost per pour = $13.49 / 17 = $0.79/pour. If a vodka cocktail sells for $6.00, pour cost = 13.2% (excellent). Target bar pour cost: 18-22% including all ingredients. Highest margin items: Schnapps ($5.00/bottle = $0.29/pour), Triple Sec ($3.50/bottle = $0.21/pour). Lowest margin items: Grand Marnier ($27.00/bottle = $1.59/pour), Woodford ($24.75/bottle = $1.46/pour).",
    tags: ["pour cost", "margin", "pricing", "liquor cost", "iowa", "absolut", "bar math"]
  },
  // === SERVER/BARTENDER 3-DAY TRAINING ===
  {
    station: "general", category: "process",
    question: "What is the Server/Bartender Day 1 training?",
    answer: "DAY 1 TRAINING: Attire — Community Shirt, beer shirts, or game-day apparel. No holes in jeans. Hair pulled back. Go over the entire menu — most popular food items, what sides (& how many) come with entrees. Tour of entire building: back-storage room (pop, condiments, coffee supplies, napkins), cleaning supplies in beer storage room, behind bar (kids cups/lids/straws), walk-in beer cooler (condiments and parmesan storage), how to make old and new parmesans. Basic computer info: clock in/out number, how to split a tab, second half on pizzas, special instructions for kitchen, split food items in half, how to upsell liquor and food. Show request-off book and how schedule works (which side of restaurant).",
    tags: ["training", "day 1", "server", "bartender", "menu", "tour", "computer", "onboarding"]
  },
  {
    station: "general", category: "process",
    question: "What is the Server/Bartender Day 2 training?",
    answer: "DAY 2 TRAINING: How to approach a table and take their order. Right follow-up questions (meat temperature, side choices). How to enter order correctly on PDQ system — do multiple practice orders. Let new server follow you to tables to show customer interaction. Explain side work rotation so no items go bad. Go through daily tasks (clean tables, napkin holders, ice, pop machine, salt/pepper, marry ketchups/mustards, fill BBQ sauces, clean menus). Go through weekly food specials — how to ring in wing specials, fish fry night, any medium pizza. Go over breakfast menu and how to ring breakfast items. Learn where to retrieve all items from cold/dry storage. Learn to roll silverware. Go through close out completely — how tip out works for bartender, all closing duties (refill items in correct spots, take apart pop machine to soak, wipe tables, empty/clean coffee pot, mop, sweep).",
    tags: ["training", "day 2", "server", "bartender", "pdq", "orders", "specials", "closing", "side work"]
  },
  {
    station: "general", category: "process",
    question: "What is the Server/Bartender Day 3 training?",
    answer: "DAY 3 TRAINING: Let new servers take tables for themselves and get the feeling for customer interaction (tips not yet included). Make sure they're comfortable with difficult orders on the computer (split tickets, split pizzas, special instructions). Make sure they can do their own check out at end of night. Make sure they know where the closing checklist is — every item must be crossed off before checkout with bartender. They will take a TEST — must have 80% or higher to pass training. New trainee MUST stay for the ENTIRE shift.",
    tags: ["training", "day 3", "server", "bartender", "test", "80 percent", "checkout", "checklist"]
  },
  // === DRIVER ONBOARDING ===
  {
    station: "general", category: "process",
    question: "What is the Day 1 driver onboarding process?",
    answer: "DAY 1 DRIVER ONBOARDING: Show how the ticket system works — which tickets are delivery vs pickup. Explain the delivery zones and out-of-town fee structure (Quality Inn $1, Kock $8, CJ & Cargil $5, Coalville $5, Deerwood/Nathan/Luke $5). Show how to fill out the driver sheet (MANDATORY for reimbursement). Explain DoorDash ticket entry process. Show dish pit expectations — between runs you are on dishes. Demonstrate proper phone answering protocol. Walk through the parking lot sweep expectations. Show mop head replacement process (fresh one every shift). Explain the Never 86'd app — how to check schedule, complete checklists, submit feedback.",
    tags: ["driver", "onboarding", "day 1", "training", "tickets", "zones", "driver sheet", "doordash"]
  },
  // === APP TRAINING ===
  {
    station: "general", category: "process",
    question: "What is the Never 86'd app training for new employees?",
    answer: "APP TRAINING DAY 1 — Basics & Navigation: Download + log into Never 86'd. Confirm schedule access & profile setup. Show where checklists live (daily tasks, training, prep). Demonstrate how to check off a task, add notes, submit feedback. Explain alerts — managers get notified when tasks are missed/marked 'needs review'. Show feedback tool — confusion, mistakes, or frustrations must be logged. No one gets in trouble for asking questions, only for ignoring them. DAY 2 — Task Management: Practice completing a real checklist. Show how alerts flow to managers. Demonstrate 'Needs Review' process. Show Employee Resources (training materials). Staff must check off tasks in real time, not after shift. End-of-Day Quiz: 3 scenarios — complete checklist and submit feedback correctly.",
    tags: ["app", "training", "never 86d", "onboarding", "checklist", "feedback", "alerts"]
  },
  // === MANAGER TRAINING ===
  {
    station: "general", category: "process",
    question: "What is the Manager training for Never 86'd?",
    answer: "MANAGER TRAINING DAY 1 — App Oversight: View all staff checklists (open + completed). Approve completed checklists. Mark items as 'not competent'. Push items to Needs Review. Send alerts manually when standards not met. DAY 2 — Accountability & Alerts: Review automatic alerts (missed tasks, needs review, end-of-shift reviews). Write & send Daily Shift Reviews. Add/remove staff in Quick Contacts Hub. Escalation: staff problem → Needs Review tab, major issue → Owner alert. DAY 3 — Leadership & Reporting: Review trainee evaluations (Day 3 reviews). Log coaching conversations. End-of-Shift Reporting — verify checklists closed, submit manager review (auto-alert to owners). Pull historical data. Final Review: walk through a full day as manager on duty using only the app.",
    tags: ["manager", "training", "never 86d", "oversight", "alerts", "accountability", "reporting"]
  },
  // === CLOSING MANAGER ===
  {
    station: "general", category: "process",
    question: "What are the Closing Manager expectations?",
    answer: "CLOSING MANAGER EXPECTATIONS: We are the last line of defense at end of night. We are to be the LAST ones to punch out. Responsible for arming the alarm every night EXCEPT Sundays and Wednesdays when front of house buffs the floors. Walk through and check all closers before they leave. Walk through again before we leave for night. Only once we have made sure no one else is in the building and the alarm can be armed can we leave.",
    tags: ["closing manager", "alarm", "last out", "security", "walk through", "expectations"]
  },
  // === EMPLOYEE REVIEW FORM ===
  {
    station: "general", category: "process",
    question: "What are the 9 categories on the employee evaluation form and the grading scale?",
    answer: "Employee Evaluation Form — 9 Categories scored 1-5: 1) Employee's work quality/Presentation. 2) Attendance/Days off/Calling In. 3) Job knowledge/Proficiency. 4) Teamwork/Work Involvement. 5) Finishing tasks/Completing checklists. 6) Overall Attitude. 7) Customer Interaction/Handling large groups/parties. 8) Multitasking skills/Decision making abilities. 9) Computer Skills/Entering orders correctly/Special instructions. GRADING: 5 = Surpasses Expectations, 4 = Meets Expectations, 3 = Bare Minimum (Average), 2 = Needs Improvement, 1 = Poor. Each category includes specific feedback notes. Form also has Overall Succession and Overall Needs Improvement sections.",
    tags: ["evaluation", "review", "form", "grading", "categories", "performance", "1-5 scale"]
  },
  // === DRINK RECIPES (KEY BRANDS) ===
  {
    station: "bar", category: "recipe",
    question: "What vodka brands does CTap carry?",
    answer: "Vodka brands: Absolut Citron, Absolut Mango, Absolut Peach, Ketel One, Strawberry Vodka, Jeremiah Weed Sweet Tea Vodka, X-Rated. Well vodka is Absolut. Premium is Ketel One.",
    tags: ["vodka", "brands", "absolut", "ketel one", "bar", "liquor"]
  },
  {
    station: "bar", category: "recipe",
    question: "What whiskey and bourbon brands does CTap carry?",
    answer: "Whiskey/Bourbon: Makers Mark (well bourbon), Woodford Reserve (premium), Jameson (Irish whiskey). Makers Mark is the well bourbon used in all bourbon cocktails unless customer specifies otherwise.",
    tags: ["whiskey", "bourbon", "makers mark", "woodford", "jameson", "bar"]
  },
  {
    station: "bar", category: "recipe",
    question: "What rum brands does CTap carry?",
    answer: "Rum: Bacardi (well white rum), Bacardi Limon, Captain Morgan (most popular — spiced), Myers Dark Rum, Malibu (coconut). Captain Morgan is the highest-volume rum. Malibu for tropical drinks.",
    tags: ["rum", "bacardi", "captain morgan", "malibu", "myers", "bar"]
  },
  {
    station: "bar", category: "recipe",
    question: "What are the garnishes and glassware used at CTap?",
    answer: "GARNISHES: Limes, Lemons, Oranges, Cherries (Filthy brand), Mint Leaves, Basil Leaves, Blackberries, Strawberries, Cucumber, Cinnamon Sticks, Thyme Sprigs, Hazelnuts, Marshmallows (toasted). GLASSWARE: Mason Jar, Rocks Glass, Martini Glass, English Highball Glass, Pint Glass, Copper Mug (Moscow Mule), White Wine Glass, Red Wine Glass, Stemmed Glass, Glass Coffee Cup, 12 Ounce Glass.",
    tags: ["garnish", "glassware", "bar", "mason jar", "rocks", "martini", "copper mug", "cherries"]
  },
  // === FRY LINE EXPECTATIONS ===
  {
    station: "general", category: "process",
    question: "What are the AM/PM Line Cook expectations?",
    answer: "AM/PM Line Cook Expectations: Arrive 10 mins early, clock in on time. Fully stocked station by open. Label, date, rotate all items used. Cook and plate according to spec — no 'freestyle'. Follow ticket times: Apps < 7 mins, Entrées < 12 mins. Maintain clean station throughout shift. Pre-close your station before end of shift. Communicate 86'd items to expo and manager.",
    tags: ["line cook", "expectations", "fry line", "ticket times", "apps", "entrees", "station"]
  },
  // === PIZZA NIGHTLY CLOSING (as knowledge) ===
  {
    station: "pizza_line", category: "process",
    question: "What is the pizza closing checklist that must be initialed nightly?",
    answer: "Pizza Closing Checklist (must be done nightly and hung up on the pick up food ticket holder — no exception): Put dough away, Clean dough roller, Wipe out inside of cold table, Wipe down lids/doors/cold table, Stainless steel the dough wall, Stainless steel the prep table, Cover all dough, Take all utensils back to dish area, Wipe down pizza table, Turn pizza ovens off, Put cheese away, Windex both pepsi coolers, Shut hoods off, Sweep and mop pizza side and store room, Fill pepsi cooler with cheese, Bleach and scrub sides of trash can, Fill all sauce bottles (Ranch, BBQ, WOW, 1000, Buffalo, SC), Fill pepsi cooler with beef and sausage, Make sure pizza line is fully stocked up top, Pull out pizza line and swipe behind it, Wipe down shelves, Put phones back on charger, Clean computer screens and counter.",
    tags: ["pizza", "closing", "checklist", "nightly", "initialed", "dough", "ovens", "sauce bottles"]
  },
  // === WEEKLY DEEP CLEAN ===
  {
    station: "general", category: "cleaning",
    question: "What is the weekly deep clean schedule for the fry line?",
    answer: "Weekly Deep Clean Fry Line AM rotation: SUNDAY — Change foil on stove. MONDAY — Deep freezer and dry storage. TUESDAY — Deep clean steak fridge and BBQ fridge. WEDNESDAY — Bleach wall behind steam table. THURSDAY — Run stove tops through dishwasher. FRIDAY — Clean up around smoker (dump bucket, sweep, clean the shelf and front). SATURDAY — Clean out bus tubs under charbroiler and seasoning shelf.",
    tags: ["deep clean", "weekly", "fry line", "rotation", "sunday", "monday", "stove", "freezer", "smoker"]
  },
];

let kbCount = 0;
for (const entry of knowledgeEntries) {
  await conn.execute(
    `INSERT INTO knowledge_entries (station, category, question, answer, tags, confidence, source) VALUES (?, ?, ?, ?, ?, 'high', 'imported')`,
    [entry.station, entry.category, entry.question, entry.answer, JSON.stringify(entry.tags)]
  );
  kbCount++;
}
console.log(`  ✓ Inserted ${kbCount} knowledge base entries (SOPs, training, vendor data)`);

console.log("\n━━━ SECTION 4 COMPLETE ━━━\n");

// ============================================================
// SECTION 5: TRAINING MODULES
// ============================================================
console.log("\n━━━ SECTION 5: Training Modules ━━━");

const trainingModules = [
  {
    name: "Server/Bartender — Day 1 (Menu, Tour, Computer)",
    description: "Go over entire menu, tour building, basic computer info (clock in/out, split tabs, special instructions, upselling). Show request-off book and schedule.",
    category: "service", requiredForTrack: "foh", requiredForLevel: 1,
    estimatedMinutes: 480, assessmentType: "trainer_signoff",
    sourceDocument: "19-server-bartender.txt"
  },
  {
    name: "Server/Bartender — Day 2 (Orders, Side Work, Close)",
    description: "Approach tables, take orders, enter on PDQ. Follow trainer to tables. Side work rotation, daily tasks, weekly specials, breakfast menu. Retrieve from storage. Roll silverware. Full close out with tip out.",
    category: "service", requiredForTrack: "foh", requiredForLevel: 1,
    estimatedMinutes: 480, assessmentType: "trainer_signoff",
    sourceDocument: "19-server-bartender.txt"
  },
  {
    name: "Server/Bartender — Day 3 (Solo Tables + Written Test)",
    description: "Take tables solo (no tips yet). Comfortable with split tickets, split pizzas, special instructions. Own checkout. Know closing checklist. MUST pass written test with 80% or higher. Must stay entire shift.",
    category: "service", requiredForTrack: "foh", requiredForLevel: 1,
    estimatedMinutes: 480, assessmentType: "written_test", passingScore: 80,
    sourceDocument: "19-server-bartender.txt"
  },
  {
    name: "Driver — Day 1 Onboarding",
    description: "Ticket system (delivery vs pickup), delivery zones and out-of-town fees, driver sheet (mandatory for reimbursement), DoorDash ticket entry, dish pit expectations, phone answering, parking lot sweep, mop head replacement, Never 86'd app intro.",
    category: "service", requiredForTrack: "driver", requiredForLevel: 1,
    estimatedMinutes: 240, assessmentType: "trainer_signoff",
    sourceDocument: "03-day1-driver-onboarding.txt"
  },
  {
    name: "Never 86'd App Training — Day 1 (Basics)",
    description: "Download + login, schedule access, profile setup, where checklists live, how to check off tasks/add notes/submit feedback, alert system explanation, feedback tool usage.",
    category: "equipment", requiredForTrack: "all", requiredForLevel: 1,
    estimatedMinutes: 60, assessmentType: "checklist_completion",
    sourceDocument: "App Training Module"
  },
  {
    name: "Never 86'd App Training — Day 2 (Task Management)",
    description: "Practice real checklist, alert flow to managers, Needs Review process, Employee Resources location, real-time task completion rule. End-of-Day Quiz: 3 scenarios.",
    category: "equipment", requiredForTrack: "all", requiredForLevel: 1,
    estimatedMinutes: 60, assessmentType: "practical_demo",
    sourceDocument: "App Training Module"
  },
  {
    name: "Manager Training — Day 1 (App Oversight)",
    description: "View all staff checklists, approve completed, mark 'not competent', push to Needs Review, send manual alerts when standards not met.",
    category: "management", requiredForTrack: "foh", requiredForLevel: 3,
    estimatedMinutes: 240, assessmentType: "manager_observation",
    sourceDocument: "Manager Training Module"
  },
  {
    name: "Manager Training — Day 2 (Accountability & Alerts)",
    description: "Review automatic alerts (missed tasks, needs review, end-of-shift). Write Daily Shift Reviews. Manage Quick Contacts Hub. Escalation protocol: staff → Needs Review, major → Owner alert.",
    category: "management", requiredForTrack: "foh", requiredForLevel: 3,
    estimatedMinutes: 240, assessmentType: "manager_observation",
    sourceDocument: "Manager Training Module"
  },
  {
    name: "Manager Training — Day 3 (Leadership & Reporting)",
    description: "Review trainee evaluations, log coaching conversations, End-of-Shift Reporting (verify checklists, submit manager review → auto-alert owners), pull historical data. Final: full day as manager on duty using only the app.",
    category: "management", requiredForTrack: "foh", requiredForLevel: 3,
    estimatedMinutes: 480, assessmentType: "manager_observation",
    sourceDocument: "Manager Training Module"
  },
];

// Don't duplicate — check existing
for (const mod of trainingModules) {
  const [existing] = await conn.execute(`SELECT id FROM worker_training_modules WHERE name = ?`, [mod.name]);
  if (existing.length === 0) {
    await conn.execute(
      `INSERT INTO worker_training_modules (name, description, category, requiredForTrack, requiredForLevel, estimatedMinutes, assessmentType, passingScore, sourceDocument) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mod.name, mod.description, mod.category, mod.requiredForTrack, mod.requiredForLevel, mod.estimatedMinutes, mod.assessmentType, mod.passingScore || null, mod.sourceDocument]
    );
  }
}
console.log(`  ✓ Inserted ${trainingModules.length} training modules`);

console.log("\n━━━ SECTION 5 COMPLETE ━━━\n");

// ============================================================
// SECTION 6: VENDOR PRODUCTS (with real par levels)
// ============================================================
console.log("\n━━━ SECTION 6: Vendor Products (Real Par Levels) ━━━");

// Clear and re-seed vendor products with real data from Ashley's and Tom's guides
await conn.execute(`DELETE FROM vendor_products`);

const vendorProducts = [
  // === WELL LIQUOR (Hy-Vee) ===
  { vendor: "Hy-Vee Wine & Spirits", name: "Absolut Vodka (Well)", cat: "liquor", unit: "bottle", price: 13.49, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Bacardi Superior (Well Rum)", cat: "liquor", unit: "bottle", price: 10.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Captain Morgan Spiced", cat: "liquor", unit: "bottle", price: 14.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Jose Cuervo (Well Tequila)", cat: "liquor", unit: "bottle", price: 14.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Fireball Cinnamon", cat: "liquor", unit: "bottle", price: 14.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Makers Mark (Well Bourbon)", cat: "liquor", unit: "bottle", price: 19.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Jameson Irish Whiskey", cat: "liquor", unit: "bottle", price: 21.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Tanqueray (Well Gin)", cat: "liquor", unit: "bottle", price: 17.99, par: 1, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Malibu Coconut Rum", cat: "liquor", unit: "bottle", price: 14.99, par: 1, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Kahlua", cat: "liquor", unit: "bottle", price: 17.99, par: 1, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Baileys Irish Cream", cat: "liquor", unit: "bottle", price: 21.99, par: 1, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Triple Sec", cat: "liquor", unit: "bottle", price: 3.50, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Southern Comfort", cat: "liquor", unit: "bottle", price: 14.99, par: 1, freq: "weekly" },
  { vendor: "Hy-Vee Wine & Spirits", name: "Rumchata", cat: "liquor", unit: "bottle", price: 18.99, par: 1, freq: "weekly" },
  // === BEER (DMB/Budweiser) ===
  { vendor: "DMB/Budweiser", name: "Bud Light Bottle 24pk", cat: "beer", unit: "case", price: 3.75, par: 3, freq: "weekly" },
  { vendor: "DMB/Budweiser", name: "Busch Light Bottle 24pk", cat: "beer", unit: "case", price: 3.75, par: 3, freq: "weekly" },
  { vendor: "DMB/Budweiser", name: "Michelob Ultra Light Can 24pk", cat: "beer", unit: "case", price: 3.75, par: 3, freq: "weekly" },
  { vendor: "DMB/Budweiser", name: "Michelob Ultra Bottle 24pk", cat: "beer", unit: "case", price: 4.00, par: 2, freq: "weekly" },
  { vendor: "DMB/Budweiser", name: "Carbliss Watermelon 24pk", cat: "beer", unit: "case", price: 7.00, par: 2, freq: "weekly" },
  { vendor: "DMB/Budweiser", name: "Carbliss Cranberry 24pk", cat: "beer", unit: "case", price: 7.00, par: 1, freq: "weekly" },
  { vendor: "DMB/Budweiser", name: "Carbliss Pineapple 24pk", cat: "beer", unit: "case", price: 7.00, par: 1, freq: "weekly" },
  { vendor: "DMB/Budweiser", name: "Carbliss Black Raspberry 24pk", cat: "beer", unit: "case", price: 7.00, par: 1, freq: "weekly" },
  // === BEER (Fort Dodge Distributing) ===
  { vendor: "Fort Dodge Distributing", name: "Coors Light Bottle 24pk", cat: "beer", unit: "case", price: 3.75, par: 3, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Miller Light Bottle 24pk", cat: "beer", unit: "case", price: 3.75, par: 3, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Miller High Life 24pk", cat: "beer", unit: "case", price: 3.75, par: 1, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Blue Moon (keg)", cat: "beer", unit: "each", price: 4.50, par: 1, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "White Claw Black Cherry 24pk", cat: "beer", unit: "case", price: 5.00, par: 2, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "White Claw Mango 24pk", cat: "beer", unit: "case", price: 5.00, par: 1, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Corona Bottle 24pk", cat: "beer", unit: "case", price: 4.50, par: 2, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Stella Bottle 24pk", cat: "beer", unit: "case", price: 4.50, par: 1, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Heineken 24pk", cat: "beer", unit: "case", price: 4.50, par: 1, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Guinness Bottle 24pk", cat: "beer", unit: "case", price: 4.50, par: 1, freq: "weekly" },
  { vendor: "Fort Dodge Distributing", name: "Angry Orchard 24pk", cat: "beer", unit: "case", price: 4.25, par: 1, freq: "weekly" },
  // === KEY PFG FOOD ITEMS ===
  { vendor: "PFG", name: "Mozzarella Block (Roma 8/6 Lb)", cat: "dairy", unit: "case", price: 98.40, par: 3, freq: "twice_weekly" },
  { vendor: "PFG", name: "Pizza Sauce Heavy w/Basil (San Benito 6/#10)", cat: "dry_goods", unit: "case", price: 82.98, par: 4, freq: "twice_weekly" },
  { vendor: "PFG", name: "Chicken Wing Jumbo (West Creek 4/10 Lb)", cat: "meat", unit: "case", price: 64.92, par: 1, freq: "twice_weekly" },
  { vendor: "PFG", name: "Beef Ribeye 8oz Angus (Two Rivers 20/8oz)", cat: "meat", unit: "case", price: 133.50, par: 1, freq: "twice_weekly" },
  { vendor: "PFG", name: "Bacon Topping Fully Cooked (Roma 2/5 Lb)", cat: "meat", unit: "case", price: 68.94, par: 2, freq: "twice_weekly" },
  { vendor: "PFG", name: "Fries Straight Cut 3/8\" (6/5 Lb)", cat: "frozen", unit: "case", price: 53.84, par: 3, freq: "twice_weekly" },
  { vendor: "PFG", name: "Oil Soy Clear Fry (1/35 Lb)", cat: "dry_goods", unit: "case", price: 79.43, par: 3, freq: "twice_weekly" },
  { vendor: "PFG", name: "Lettuce Iceberg Shredded (4/5 Lb)", cat: "produce", unit: "case", price: 31.46, par: 1, freq: "twice_weekly" },
  { vendor: "PFG", name: "Glove Nitrile XL Blue (10/100)", cat: "paper", unit: "case", price: 80.42, par: 1, freq: "twice_weekly" },
  { vendor: "PFG", name: "Can Liner Black 40x46 (10/10)", cat: "paper", unit: "case", price: 57.90, par: 1, freq: "twice_weekly" },
  { vendor: "PFG", name: "Napkin Xpress 13x8.5 (12/500)", cat: "paper", unit: "case", price: 57.90, par: 1, freq: "twice_weekly" },
  { vendor: "PFG", name: "Garlic Bread Sticks (Baker Boy 144/1.5)", cat: "bread", unit: "case", price: 45.42, par: 1, freq: "twice_weekly" },
  { vendor: "PFG", name: "Pasta Elbow Mac Fully Cooked (Marzetti 6/3 Lb)", cat: "dry_goods", unit: "case", price: 36.69, par: 2, freq: "twice_weekly" },
  // === BAR MIXERS (Hy-Vee/Local) ===
  { vendor: "Hy-Vee", name: "Orange Juice (carton)", cat: "other", unit: "each", price: 4.99, par: 3, freq: "weekly" },
  { vendor: "Hy-Vee", name: "Cranberry Juice (carton)", cat: "other", unit: "each", price: 3.99, par: 3, freq: "weekly" },
  { vendor: "Hy-Vee", name: "Pineapple Juice (carton)", cat: "other", unit: "each", price: 3.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee", name: "Chocolate Milk (carton)", cat: "other", unit: "each", price: 3.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee", name: "Half and Half", cat: "other", unit: "each", price: 4.99, par: 2, freq: "weekly" },
  { vendor: "Hy-Vee", name: "Ginger Beer (case)", cat: "other", unit: "case", price: 12.99, par: 2, freq: "weekly" },
];

let vpCount = 0;
for (const vp of vendorProducts) {
  await conn.execute(
    `INSERT INTO vendor_products (vendorName, productName, category, unit, lastPrice, parLevel, orderFrequency, active) VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
    [vp.vendor, vp.name, vp.cat, vp.unit, vp.price, vp.par, vp.freq]
  );
  vpCount++;
}
console.log(`  ✓ Inserted ${vpCount} vendor products with real par levels`);

console.log("\n━━━ SECTION 6 COMPLETE ━━━\n");

// ============================================================
// FINAL VERIFICATION
// ============================================================
console.log("\n━━━ FINAL VERIFICATION ━━━");

const [clCount] = await conn.execute(`SELECT COUNT(*) as cnt FROM checklists`);
const [kbTotal] = await conn.execute(`SELECT COUNT(*) as cnt FROM knowledge_entries`);
const [vpTotal] = await conn.execute(`SELECT COUNT(*) as cnt FROM vendor_products`);
const [skTotal] = await conn.execute(`SELECT COUNT(*) as cnt FROM sku_catalog`);
const [miTotal] = await conn.execute(`SELECT COUNT(*) as cnt FROM menu_items`);
const [tmTotal] = await conn.execute(`SELECT COUNT(*) as cnt FROM worker_training_modules`);

console.log(`  Checklists: ${clCount[0].cnt}`);
console.log(`  Knowledge Entries: ${kbTotal[0].cnt}`);
console.log(`  Vendor Products: ${vpTotal[0].cnt}`);
console.log(`  SKU Catalog: ${skTotal[0].cnt}`);
console.log(`  Menu Items: ${miTotal[0].cnt}`);
console.log(`  Training Modules: ${tmTotal[0].cnt}`);

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  WAVE 21 COMPLETE — ALL REAL DATA IMPORTED                  ║");
console.log("╚══════════════════════════════════════════════════════════════╝");

await conn.end();
