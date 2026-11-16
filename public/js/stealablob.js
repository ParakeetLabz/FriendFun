// Steal a Blob — Funtopia game mode (original blob characters, no copied assets).
// Deterministic blob spawning (seeded by gameId) + relayed buy/steal/slap events,
// so every client in the room agrees on blobs without server-side game state.
import * as THREE from 'three';

export const SAB_BASES = [
  { x: -22, z: -22 }, { x: 22, z: -22 }, { x: -22, z: 22 }, { x: 22, z: 22 },
  { x: 0, z: -26 }, { x: 0, z: 26 }, { x: -26, z: 0 }, { x: 26, z: 0 },
];
export const SAB_SLOTS = 6;
// Base colors + names, in the same order as worlds.js stealablob() colors.
export const SAB_BASE_COLORS = [
  { hex: '#4a90e2', name: 'blue' }, { hex: '#e24a4a', name: 'red' },
  { hex: '#2ed573', name: 'green' }, { hex: '#ffd700', name: 'gold' },
  { hex: '#9b59e6', name: 'purple' }, { hex: '#ff9f43', name: 'orange' },
  { hex: '#3ee6c4', name: 'teal' }, { hex: '#ff5e8a', name: 'pink' },
];
export function sabSlotPos(baseIdx, slotIdx) {
  const b = SAB_BASES[baseIdx];
  const row = Math.floor(slotIdx / 3), col = slotIdx % 3;
  return { x: b.x + (col - 1) * 4, z: b.z + (row - 0.5) * 4 };
}

const RARITY_W = { common: 72, rare: 19, epic: 6, legendary: 2.2, mythic: 0.8, secret: 0 };
export const SAB_BLOBS = [
  { name: 'Bloop', rarity: 'common', price: 50, income: 2, color: '#5ec8f2', hat: null },
  { name: 'Gooey', rarity: 'common', price: 75, income: 3, color: '#7ed957', hat: null },
  { name: 'Pudding', rarity: 'common', price: 100, income: 4, color: '#ff9ecb', hat: null },
  { name: 'Jiggly', rarity: 'rare', price: 250, income: 8, color: '#b07fe8', hat: 'bow' },
  { name: 'Splat', rarity: 'rare', price: 400, income: 12, color: '#ff9f43', hat: null },
  { name: 'Glimmer', rarity: 'epic', price: 800, income: 25, color: '#3ee6c4', hat: 'sparkle' },
  { name: 'Mochi', rarity: 'epic', price: 1200, income: 35, color: '#f5f5f5', hat: 'ears' },
  { name: 'King Blob', rarity: 'legendary', price: 3000, income: 90, color: '#ffd700', hat: 'crown' },
  { name: 'Rainbow Blob', rarity: 'mythic', price: 10000, income: 300, color: '#ff5e8a', hat: 'halo' },
  { name: 'Shadow Blob', rarity: 'legendary', price: 5000, income: 150, color: '#5a4a8a', hat: null },
  { name: 'Galaxy Blob', rarity: 'mythic', price: 25000, income: 900, color: '#7b2ff7', hat: 'sparkle' },
  { name: 'Void Blob', rarity: 'mythic', price: 75000, income: 2500, color: '#17141f', hat: 'crown' },
  { name: 'Scout Blob', rarity: 'secret', price: 100000, income: 1500, color: '#0a0a12', hat: 'scout', noSteal: true },
  { name: 'Sleepy Robot', rarity: 'common', price: 110, income: 4, color: '#ff6b81', hat: null },
  { name: 'Midnight Comet', rarity: 'common', price: 150, income: 5, color: '#ff9f43', hat: null },
  { name: 'Sneaky Ginger', rarity: 'common', price: 380, income: 13, color: '#b2bec3', hat: null },
  { name: 'Drowsy Frog', rarity: 'common', price: 90, income: 3, color: '#f368e0', hat: null },
  { name: 'Zombie Llama', rarity: 'common', price: 170, income: 6, color: '#feca57', hat: null },
  { name: 'Volcanic Koala', rarity: 'common', price: 250, income: 8, color: '#e17055', hat: null },
  { name: 'Ninja Taco', rarity: 'common', price: 250, income: 8, color: '#55efc4', hat: null },
  { name: 'Ninja Ramen', rarity: 'common', price: 50, income: 2, color: '#ff6b81', hat: null },
  { name: 'Starry Ramen', rarity: 'common', price: 460, income: 15, color: '#ff6b81', hat: null },
  { name: 'Wild Llama', rarity: 'common', price: 85, income: 3, color: '#fd79a8', hat: 'ears' },
  { name: 'Smiley Beaver', rarity: 'common', price: 150, income: 5, color: '#ff7f50', hat: null },
  { name: 'Rainbow Bee', rarity: 'common', price: 90, income: 3, color: '#7bed9f', hat: null },
  { name: 'Rusty Muffin', rarity: 'common', price: 260, income: 9, color: '#81ecec', hat: null },
  { name: 'Magic Horse', rarity: 'common', price: 360, income: 12, color: '#81ecec', hat: null },
  { name: 'Fierce Llama', rarity: 'common', price: 55, income: 2, color: '#74b9ff', hat: null },
  { name: 'Lucky Knight', rarity: 'common', price: 110, income: 4, color: '#81ecec', hat: null },
  { name: 'Sneaky Burger', rarity: 'common', price: 400, income: 13, color: '#00cec9', hat: null },
  { name: 'Zesty Snowman', rarity: 'common', price: 55, income: 2, color: '#fdcb6e', hat: null },
  { name: 'Thunder Donut', rarity: 'common', price: 140, income: 5, color: '#7b2ff7', hat: null },
  { name: 'Arctic Owl', rarity: 'common', price: 380, income: 13, color: '#1dd1a1', hat: null },
  { name: 'Sleepy Zombie', rarity: 'common', price: 390, income: 13, color: '#dfe6e9', hat: null },
  { name: 'Cozy Shark', rarity: 'common', price: 100, income: 3, color: '#6c5ce7', hat: null },
  { name: 'Spicy Pudding', rarity: 'common', price: 260, income: 9, color: '#ff5e8a', hat: null },
  { name: 'Bubbly Salsa', rarity: 'common', price: 55, income: 2, color: '#70a1ff', hat: null },
  { name: 'Glitter Monkey', rarity: 'common', price: 60, income: 2, color: '#fd79a8', hat: null },
  { name: 'Bouncy Pirate', rarity: 'common', price: 230, income: 8, color: '#ffa502', hat: null },
  { name: 'Moonlit Jelly', rarity: 'common', price: 190, income: 6, color: '#55efc4', hat: null },
  { name: 'Cheesy Salsa', rarity: 'common', price: 470, income: 16, color: '#fab1a0', hat: null },
  { name: 'Forest Knight', rarity: 'common', price: 130, income: 4, color: '#5f27cd', hat: null },
  { name: 'Wacky Pepper', rarity: 'common', price: 160, income: 5, color: '#2e86de', hat: null },
  { name: 'Groovy Rocket', rarity: 'common', price: 95, income: 3, color: '#eccc68', hat: null },
  { name: 'Sweet Star', rarity: 'common', price: 100, income: 3, color: '#fd79a8', hat: null },
  { name: 'Sunny Wasabi', rarity: 'common', price: 250, income: 8, color: '#2ed573', hat: 'bow' },
  { name: 'Glitter Beaver', rarity: 'common', price: 75, income: 2, color: '#6c5ce7', hat: null },
  { name: 'Volcanic Monkey', rarity: 'common', price: 170, income: 6, color: '#00d2d3', hat: null },
  { name: 'Ember Jelly', rarity: 'common', price: 310, income: 10, color: '#70a1ff', hat: null },
  { name: 'Bubble Skeleton', rarity: 'common', price: 120, income: 4, color: '#f9ca24', hat: null },
  { name: 'Desert Bee', rarity: 'common', price: 210, income: 7, color: '#f368e0', hat: null },
  { name: 'Spicy Moonbeam', rarity: 'common', price: 280, income: 9, color: '#7b2ff7', hat: null },
  { name: 'Stormy Tiger', rarity: 'common', price: 75, income: 2, color: '#3ee6c4', hat: null },
  { name: 'Rainbow Ginger', rarity: 'common', price: 140, income: 5, color: '#ffa502', hat: null },
  { name: 'Groovy Sunbeam', rarity: 'common', price: 90, income: 3, color: '#f9ca24', hat: null },
  { name: 'Tiny Pizza', rarity: 'common', price: 70, income: 2, color: '#74b9ff', hat: null },
  { name: 'Bouncy Wolf', rarity: 'common', price: 80, income: 3, color: '#ffa502', hat: null },
  { name: 'Fierce Waffle', rarity: 'common', price: 170, income: 6, color: '#6c5ce7', hat: null },
  { name: 'Wild Burrito', rarity: 'common', price: 150, income: 5, color: '#55efc4', hat: null },
  { name: 'Melty Cookie', rarity: 'common', price: 130, income: 4, color: '#a29bfe', hat: null },
  { name: 'Cheesy Jellyfish', rarity: 'common', price: 200, income: 7, color: '#1e90ff', hat: null },
  { name: 'Jumbo Guac', rarity: 'common', price: 360, income: 12, color: '#ff9f43', hat: null },
  { name: 'Ultra Cupcake', rarity: 'common', price: 70, income: 2, color: '#c56cf0', hat: null },
  { name: 'Dizzy Koala', rarity: 'common', price: 150, income: 5, color: '#ff9ff3', hat: null },
  { name: 'Volcanic Horse', rarity: 'common', price: 370, income: 12, color: '#5352ed', hat: null },
  { name: 'Ocean Panda', rarity: 'common', price: 210, income: 7, color: '#6c5ce7', hat: null },
  { name: 'Super Sushi', rarity: 'common', price: 75, income: 2, color: '#eccc68', hat: null },
  { name: 'Chill Starfish', rarity: 'common', price: 50, income: 2, color: '#f9ca24', hat: null },
  { name: 'Crystal Ninja', rarity: 'common', price: 120, income: 4, color: '#6c5ce7', hat: null },
  { name: 'Candy Dragon', rarity: 'common', price: 210, income: 7, color: '#1dd1a1', hat: null },
  { name: 'Dizzy Popcorn', rarity: 'common', price: 250, income: 8, color: '#ff7675', hat: null },
  { name: 'Mega Bee', rarity: 'common', price: 60, income: 2, color: '#ff9ff3', hat: null },
  { name: 'Sunset Pudding', rarity: 'common', price: 65, income: 2, color: '#e84393', hat: null },
  { name: 'Wild Ninja', rarity: 'common', price: 150, income: 5, color: '#55efc4', hat: null },
  { name: 'Wobbly Boba', rarity: 'common', price: 150, income: 5, color: '#ffeaa7', hat: null },
  { name: 'Stormy Owl', rarity: 'common', price: 170, income: 6, color: '#b2bec3', hat: null },
  { name: 'Cozy Rocket', rarity: 'common', price: 270, income: 9, color: '#fdcb6e', hat: null },
  { name: 'Rainbow Apple', rarity: 'common', price: 100, income: 3, color: '#ff4757', hat: null },
  { name: 'Zombie Apple', rarity: 'common', price: 65, income: 2, color: '#ff9ff3', hat: null },
  { name: 'Juicy Tiger', rarity: 'common', price: 380, income: 13, color: '#f368e0', hat: null },
  { name: 'Crispy Cupcake', rarity: 'common', price: 180, income: 6, color: '#ff9f43', hat: null },
  { name: 'Fierce Monkey', rarity: 'common', price: 75, income: 2, color: '#fab1a0', hat: 'bow' },
  { name: 'Frosty Banana', rarity: 'common', price: 220, income: 7, color: '#ffd32a', hat: null },
  { name: 'Sour Rocket', rarity: 'common', price: 75, income: 2, color: '#0984e3', hat: 'bow' },
  { name: 'Wizard Frog', rarity: 'common', price: 370, income: 12, color: '#feca57', hat: null },
  { name: 'Wacky Wasabi', rarity: 'common', price: 50, income: 2, color: '#6c5ce7', hat: 'bow' },
  { name: 'Volcanic Snowman', rarity: 'common', price: 140, income: 5, color: '#7bed9f', hat: null },
  { name: 'Arctic Cocoa', rarity: 'common', price: 450, income: 15, color: '#ff9ff3', hat: null },
  { name: 'Shadow Sloth', rarity: 'common', price: 150, income: 5, color: '#ff7f50', hat: null },
  { name: 'Ocean Carrot', rarity: 'common', price: 70, income: 2, color: '#fdcb6e', hat: null },
  { name: 'Funky Lollipop', rarity: 'common', price: 110, income: 4, color: '#7b2ff7', hat: null },
  { name: 'Shadow Burrito', rarity: 'common', price: 180, income: 6, color: '#7bed9f', hat: 'bow' },
  { name: 'Starry Banana', rarity: 'common', price: 100, income: 3, color: '#b2bec3', hat: null },
  { name: 'Tiny Sushi', rarity: 'common', price: 110, income: 4, color: '#6c5ce7', hat: 'ears' },
  { name: 'Smiley Koala', rarity: 'common', price: 420, income: 14, color: '#6c5ce7', hat: null },
  { name: 'Salty Duck', rarity: 'common', price: 400, income: 13, color: '#1e90ff', hat: null },
  { name: 'Sunset Sloth', rarity: 'common', price: 200, income: 7, color: '#ff9f43', hat: null },
  { name: 'Honey Carrot', rarity: 'common', price: 150, income: 5, color: '#ff6b81', hat: null },
  { name: 'Ocean Chick', rarity: 'common', price: 340, income: 11, color: '#d63031', hat: null },
  { name: 'Sunset Horse', rarity: 'common', price: 80, income: 3, color: '#ff6b81', hat: null },
  { name: 'Honey Unicorn', rarity: 'common', price: 350, income: 12, color: '#74b9ff', hat: null },
  { name: 'Desert Octopus', rarity: 'common', price: 140, income: 5, color: '#00d2d3', hat: null },
  { name: 'Sleepy Pizza', rarity: 'common', price: 120, income: 4, color: '#f9ca24', hat: null },
  { name: 'Ember Toffee', rarity: 'common', price: 240, income: 8, color: '#5352ed', hat: null },
  { name: 'Crystal Wizard', rarity: 'common', price: 300, income: 10, color: '#ff9f43', hat: null },
  { name: 'Chill Bear', rarity: 'common', price: 370, income: 12, color: '#00d2d3', hat: null },
  { name: 'Gentle Toffee', rarity: 'common', price: 330, income: 11, color: '#00cec9', hat: null },
  { name: 'Jolly Horse', rarity: 'common', price: 55, income: 2, color: '#ffeaa7', hat: null },
  { name: 'Tiny Cat', rarity: 'common', price: 280, income: 9, color: '#f368e0', hat: null },
  { name: 'Dizzy Unicorn', rarity: 'common', price: 85, income: 3, color: '#ff5e8a', hat: null },
  { name: 'Fierce Burger', rarity: 'common', price: 210, income: 7, color: '#feca57', hat: 'bow' },
  { name: 'Glitter Toffee', rarity: 'common', price: 260, income: 9, color: '#f368e0', hat: null },
  { name: 'Royal Ninja', rarity: 'common', price: 55, income: 2, color: '#f368e0', hat: 'bow' },
  { name: 'Speedy Panda', rarity: 'common', price: 90, income: 3, color: '#1e90ff', hat: null },
  { name: 'Stormy Sushi', rarity: 'common', price: 110, income: 4, color: '#00d2d3', hat: null },
  { name: 'Starry Carrot', rarity: 'common', price: 110, income: 4, color: '#a29bfe', hat: null },
  { name: 'Desert Owl', rarity: 'common', price: 110, income: 4, color: '#636e72', hat: null },
  { name: 'Groovy Donut', rarity: 'common', price: 65, income: 2, color: '#ff6b81', hat: null },
  { name: 'Moonlit Pancake', rarity: 'common', price: 140, income: 5, color: '#70a1ff', hat: null },
  { name: 'Groovy Cow', rarity: 'common', price: 80, income: 3, color: '#fdcb6e', hat: null },
  { name: 'Bubble Mango', rarity: 'common', price: 260, income: 9, color: '#70a1ff', hat: null },
  { name: 'Shadow Comet', rarity: 'common', price: 60, income: 2, color: '#636e72', hat: null },
  { name: 'Thunder Ninja', rarity: 'common', price: 90, income: 3, color: '#ff5e8a', hat: null },
  { name: 'Ninja Unicorn', rarity: 'common', price: 75, income: 2, color: '#48dbfb', hat: null },
  { name: 'Chill Turtle', rarity: 'common', price: 250, income: 8, color: '#f9ca24', hat: null },
  { name: 'Volcanic Latte', rarity: 'common', price: 140, income: 5, color: '#d63031', hat: 'bow' },
  { name: 'Cosmic Snowflake', rarity: 'common', price: 320, income: 11, color: '#d63031', hat: 'bow' },
  { name: 'Jumbo Cat', rarity: 'common', price: 240, income: 8, color: '#feca57', hat: null },
  { name: 'Salty Jellyfish', rarity: 'common', price: 85, income: 3, color: '#fdcb6e', hat: null },
  { name: 'Spicy Knight', rarity: 'common', price: 120, income: 4, color: '#f368e0', hat: null },
  { name: 'Spicy Waffle', rarity: 'common', price: 350, income: 12, color: '#fab1a0', hat: null },
  { name: 'Funky Cocoa', rarity: 'common', price: 210, income: 7, color: '#ff7675', hat: null },
  { name: 'Sleepy Spider', rarity: 'common', price: 100, income: 3, color: '#81ecec', hat: 'ears' },
  { name: 'Melty Alien', rarity: 'common', price: 340, income: 11, color: '#636e72', hat: null },
  { name: 'Sleepy Bat', rarity: 'common', price: 55, income: 2, color: '#3ee6c4', hat: null },
  { name: 'Shadow Pickle', rarity: 'common', price: 470, income: 16, color: '#ff7f50', hat: null },
  { name: 'Jolly Dolphin', rarity: 'common', price: 330, income: 11, color: '#e84393', hat: null },
  { name: 'Zesty Bear', rarity: 'common', price: 280, income: 9, color: '#48dbfb', hat: null },
  { name: 'Ocean Snowflake', rarity: 'common', price: 130, income: 4, color: '#81ecec', hat: null },
  { name: 'Chill Lion', rarity: 'common', price: 400, income: 13, color: '#d63031', hat: null },
  { name: 'Wobbly Comet', rarity: 'common', price: 210, income: 7, color: '#ff7f50', hat: null },
  { name: 'Juicy Burger', rarity: 'common', price: 430, income: 14, color: '#1dd1a1', hat: null },
  { name: 'Speedy Skeleton', rarity: 'common', price: 450, income: 15, color: '#fab1a0', hat: null },
  { name: 'Jumbo Sloth', rarity: 'common', price: 110, income: 4, color: '#00cec9', hat: null },
  { name: 'Sweet Beaver', rarity: 'common', price: 60, income: 2, color: '#d63031', hat: null },
  { name: 'Rainbow Fox', rarity: 'common', price: 420, income: 14, color: '#48dbfb', hat: null },
  { name: 'Grumpy Toffee', rarity: 'common', price: 90, income: 3, color: '#6c5ce7', hat: null },
  { name: 'Bubble Alpaca', rarity: 'common', price: 80, income: 3, color: '#636e72', hat: null },
  { name: 'Neon Cupcake', rarity: 'common', price: 180, income: 6, color: '#00d2d3', hat: null },
  { name: 'Ocean Owl', rarity: 'common', price: 290, income: 10, color: '#7b2ff7', hat: null },
  { name: 'Juicy Melon', rarity: 'common', price: 180, income: 6, color: '#2ed573', hat: 'bow' },
  { name: 'Smiley Whale', rarity: 'common', price: 360, income: 12, color: '#ff6b6b', hat: null },
  { name: 'Zombie Robot', rarity: 'common', price: 200, income: 7, color: '#a29bfe', hat: null },
  { name: 'Alien Boba', rarity: 'common', price: 360, income: 12, color: '#2e86de', hat: null },
  { name: 'Arctic Pickle', rarity: 'common', price: 95, income: 3, color: '#ffa502', hat: null },
  { name: 'Ultra Unicorn', rarity: 'common', price: 330, income: 11, color: '#0984e3', hat: 'ears' },
  { name: 'Turbo Star', rarity: 'common', price: 50, income: 2, color: '#b2bec3', hat: null },
  { name: 'Tiny Bat', rarity: 'common', price: 110, income: 4, color: '#5352ed', hat: null },
  { name: 'Sweet Firefly', rarity: 'common', price: 150, income: 5, color: '#5f27cd', hat: null },
  { name: 'Ember Nacho', rarity: 'common', price: 120, income: 4, color: '#ffeaa7', hat: null },
  { name: 'Grumpy Penguin', rarity: 'common', price: 95, income: 3, color: '#a29bfe', hat: null },
  { name: 'Wild Chick', rarity: 'common', price: 370, income: 12, color: '#ff6b6b', hat: null },
  { name: 'Cloudy Mermaid', rarity: 'common', price: 180, income: 6, color: '#ffa502', hat: null },
  { name: 'Wobbly Apple', rarity: 'common', price: 80, income: 3, color: '#a29bfe', hat: null },
  { name: 'Zesty Bat', rarity: 'common', price: 80, income: 3, color: '#00d2d3', hat: 'ears' },
  { name: 'Groovy Jelly', rarity: 'common', price: 140, income: 5, color: '#ffd32a', hat: null },
  { name: 'Dizzy Hotdog', rarity: 'common', price: 240, income: 8, color: '#5352ed', hat: null },
  { name: 'Ninja Banana', rarity: 'common', price: 55, income: 2, color: '#0984e3', hat: 'bow' },
  { name: 'Fluffy Horse', rarity: 'common', price: 75, income: 2, color: '#74b9ff', hat: null },
  { name: 'Smiley Alien', rarity: 'common', price: 65, income: 2, color: '#48dbfb', hat: 'bow' },
  { name: 'Shadow Cupcake', rarity: 'common', price: 120, income: 4, color: '#2ed573', hat: null },
  { name: 'Smiley Wasabi', rarity: 'common', price: 390, income: 13, color: '#fdcb6e', hat: 'bow' },
  { name: 'Glitter Crab', rarity: 'common', price: 160, income: 5, color: '#ffeaa7', hat: null },
  { name: 'Golden Robot', rarity: 'common', price: 400, income: 13, color: '#fab1a0', hat: null },
  { name: 'Honey Whale', rarity: 'common', price: 410, income: 14, color: '#ff6b6b', hat: null },
  { name: 'Sunset Matcha', rarity: 'common', price: 380, income: 13, color: '#e17055', hat: 'ears' },
  { name: 'Sneaky Panda', rarity: 'common', price: 90, income: 3, color: '#2e86de', hat: null },
  { name: 'Salty Mango', rarity: 'common', price: 50, income: 2, color: '#ffa502', hat: 'ears' },
  { name: 'Super Moose', rarity: 'common', price: 250, income: 8, color: '#dfe6e9', hat: 'bow' },
  { name: 'Royal Brownie', rarity: 'common', price: 450, income: 15, color: '#ff9ff3', hat: null },
  { name: 'Alien Muffin', rarity: 'common', price: 410, income: 14, color: '#7b2ff7', hat: null },
  { name: 'Cozy Dog', rarity: 'common', price: 55, income: 2, color: '#5352ed', hat: null },
  { name: 'Cosmic Mermaid', rarity: 'common', price: 200, income: 7, color: '#d63031', hat: 'ears' },
  { name: 'Magic Moonbeam', rarity: 'common', price: 110, income: 4, color: '#fd79a8', hat: 'bow' },
  { name: 'Royal Butterfly', rarity: 'common', price: 140, income: 5, color: '#636e72', hat: null },
  { name: 'Sneaky Spider', rarity: 'common', price: 80, income: 3, color: '#a29bfe', hat: null },
  { name: 'Spicy Lollipop', rarity: 'common', price: 70, income: 2, color: '#74b9ff', hat: 'ears' },
  { name: 'Stormy Monster', rarity: 'common', price: 80, income: 3, color: '#7b2ff7', hat: null },
  { name: 'Silly Pickle', rarity: 'common', price: 410, income: 14, color: '#3ee6c4', hat: null },
  { name: 'Starry Skeleton', rarity: 'common', price: 270, income: 9, color: '#ff7f50', hat: null },
  { name: 'Brave Bee', rarity: 'common', price: 190, income: 6, color: '#ffeaa7', hat: null },
  { name: 'Zombie Toffee', rarity: 'common', price: 160, income: 5, color: '#b2bec3', hat: null },
  { name: 'Candy Brownie', rarity: 'common', price: 120, income: 4, color: '#6c5ce7', hat: null },
  { name: 'Arctic Penguin', rarity: 'common', price: 90, income: 3, color: '#f9ca24', hat: null },
  { name: 'Midnight Star', rarity: 'common', price: 210, income: 7, color: '#f368e0', hat: null },
  { name: 'Juicy Snowflake', rarity: 'common', price: 60, income: 2, color: '#ffd32a', hat: 'ears' },
  { name: 'Salty Guac', rarity: 'common', price: 60, income: 2, color: '#e17055', hat: null },
  { name: 'Giant Dog', rarity: 'common', price: 130, income: 4, color: '#f9ca24', hat: null },
  { name: 'Jolly Zombie', rarity: 'common', price: 100, income: 3, color: '#f368e0', hat: null },
  { name: 'Ninja Lion', rarity: 'common', price: 170, income: 6, color: '#ff7f50', hat: null },
  { name: 'Jolly Peach', rarity: 'common', price: 360, income: 12, color: '#636e72', hat: null },
  { name: 'Crispy Dog', rarity: 'common', price: 55, income: 2, color: '#fd79a8', hat: null },
  { name: 'Crystal Ramen', rarity: 'common', price: 180, income: 6, color: '#3ee6c4', hat: null },
  { name: 'Alien Cat', rarity: 'common', price: 240, income: 8, color: '#7bed9f', hat: null },
  { name: 'Smiley Snake', rarity: 'common', price: 140, income: 5, color: '#e84393', hat: null },
  { name: 'Thunder Pig', rarity: 'common', price: 65, income: 2, color: '#dfe6e9', hat: null },
  { name: 'Arctic Muffin', rarity: 'common', price: 50, income: 2, color: '#b2bec3', hat: 'bow' },
  { name: 'Melty Cow', rarity: 'common', price: 310, income: 10, color: '#f368e0', hat: null },
  { name: 'Volcanic Pepper', rarity: 'common', price: 270, income: 9, color: '#6c5ce7', hat: null },
  { name: 'Sweet Pig', rarity: 'common', price: 200, income: 7, color: '#7bed9f', hat: null },
  { name: 'Cozy Jellyfish', rarity: 'common', price: 320, income: 11, color: '#f368e0', hat: null },
  { name: 'Electric Muffin', rarity: 'common', price: 120, income: 4, color: '#00d2d3', hat: null },
  { name: 'Silly Cupcake', rarity: 'common', price: 180, income: 6, color: '#00b894', hat: null },
  { name: 'Rusty Zombie', rarity: 'common', price: 150, income: 5, color: '#ff6b81', hat: null },
  { name: 'Crystal Fries', rarity: 'common', price: 120, income: 4, color: '#fd79a8', hat: null },
  { name: 'Magic Apple', rarity: 'common', price: 85, income: 3, color: '#1e90ff', hat: 'bow' },
  { name: 'Shiny Turtle', rarity: 'common', price: 290, income: 10, color: '#ff5e8a', hat: 'ears' },
  { name: 'Tiny Knight', rarity: 'common', price: 65, income: 2, color: '#f9ca24', hat: null },
  { name: 'Groovy Panda', rarity: 'common', price: 170, income: 6, color: '#dfe6e9', hat: null },
  { name: 'Funky Cat', rarity: 'common', price: 400, income: 13, color: '#f368e0', hat: null },
  { name: 'Thunder Boba', rarity: 'common', price: 150, income: 5, color: '#ff9ff3', hat: null },
  { name: 'Spicy Alien', rarity: 'common', price: 340, income: 11, color: '#2ed573', hat: 'bow' },
  { name: 'Shadow Fries', rarity: 'common', price: 80, income: 3, color: '#a29bfe', hat: null },
  { name: 'Pirate Star', rarity: 'common', price: 390, income: 13, color: '#e17055', hat: 'ears' },
  { name: 'Cheesy Moose', rarity: 'common', price: 370, income: 12, color: '#ff6b6b', hat: 'ears' },
  { name: 'Stormy Duck', rarity: 'common', price: 60, income: 2, color: '#f9ca24', hat: null },
  { name: 'Thunder Crab', rarity: 'common', price: 460, income: 15, color: '#eccc68', hat: null },
  { name: 'Silly Noodle', rarity: 'common', price: 180, income: 6, color: '#ff6b81', hat: null },
  { name: 'Sleepy Matcha', rarity: 'common', price: 85, income: 3, color: '#e17055', hat: null },
  { name: 'Gentle Moonbeam', rarity: 'common', price: 200, income: 7, color: '#ffd32a', hat: null },
  { name: 'Happy Penguin', rarity: 'common', price: 70, income: 2, color: '#fdcb6e', hat: null },
  { name: 'Drowsy Wizard', rarity: 'common', price: 220, income: 7, color: '#ff4757', hat: null },
  { name: 'Midnight Donut', rarity: 'common', price: 130, income: 4, color: '#00d2d3', hat: null },
  { name: 'Mini Ninja', rarity: 'common', price: 85, income: 3, color: '#5352ed', hat: null },
  { name: 'Magic Shark', rarity: 'common', price: 100, income: 3, color: '#fab1a0', hat: null },
  { name: 'Sneaky Pretzel', rarity: 'common', price: 170, income: 6, color: '#00cec9', hat: null },
  { name: 'Velvet Mermaid', rarity: 'common', price: 60, income: 2, color: '#ff4757', hat: null },
  { name: 'Cheesy Octopus', rarity: 'common', price: 60, income: 2, color: '#fd79a8', hat: null },
  { name: 'Juicy Bear', rarity: 'common', price: 440, income: 15, color: '#74b9ff', hat: null },
  { name: 'Salty Chick', rarity: 'common', price: 300, income: 10, color: '#fdcb6e', hat: null },
  { name: 'Golden Raindrop', rarity: 'common', price: 280, income: 9, color: '#ff6b6b', hat: null },
  { name: 'Sneaky Moose', rarity: 'common', price: 200, income: 7, color: '#00cec9', hat: null },
  { name: 'Honey Alien', rarity: 'common', price: 100, income: 3, color: '#81ecec', hat: null },
  { name: 'Silly Vampire', rarity: 'common', price: 470, income: 16, color: '#ffd32a', hat: null },
  { name: 'Sour Knight', rarity: 'common', price: 60, income: 2, color: '#55efc4', hat: 'ears' },
  { name: 'Funky Butterfly', rarity: 'common', price: 60, income: 2, color: '#6c5ce7', hat: null },
  { name: 'Peppermint Mango', rarity: 'common', price: 340, income: 11, color: '#ff4757', hat: null },
  { name: 'Sour Pig', rarity: 'common', price: 100, income: 3, color: '#2e86de', hat: null },
  { name: 'Peppermint Ramen', rarity: 'common', price: 180, income: 6, color: '#6c5ce7', hat: null },
  { name: 'Fierce Melon', rarity: 'common', price: 350, income: 12, color: '#7b2ff7', hat: null },
  { name: 'Wacky Bat', rarity: 'common', price: 260, income: 9, color: '#7b2ff7', hat: 'ears' },
  { name: 'Speedy Cow', rarity: 'common', price: 120, income: 4, color: '#fdcb6e', hat: null },
  { name: 'Juicy Ramen', rarity: 'common', price: 120, income: 4, color: '#81ecec', hat: null },
  { name: 'Frosty Cupcake', rarity: 'common', price: 85, income: 3, color: '#c56cf0', hat: 'bow' },
  { name: 'Lucky Moose', rarity: 'common', price: 140, income: 5, color: '#ffa502', hat: null },
  { name: 'Peppermint Bear', rarity: 'common', price: 380, income: 13, color: '#00b894', hat: null },
  { name: 'Smiley Salsa', rarity: 'common', price: 180, income: 6, color: '#dfe6e9', hat: null },
  { name: 'Funky Grape', rarity: 'common', price: 85, income: 3, color: '#81ecec', hat: null },
  { name: 'Rainbow Burrito', rarity: 'common', price: 180, income: 6, color: '#48dbfb', hat: null },
  { name: 'Arctic Cow', rarity: 'common', price: 180, income: 6, color: '#55efc4', hat: null },
  { name: 'Glitter Tiger', rarity: 'common', price: 95, income: 3, color: '#ff6b81', hat: null },
  { name: 'Tiny Mochi', rarity: 'common', price: 450, income: 15, color: '#3ee6c4', hat: null },
  { name: 'Desert Alien', rarity: 'common', price: 400, income: 13, color: '#ff7f50', hat: null },
  { name: 'Brave Donut', rarity: 'common', price: 55, income: 2, color: '#feca57', hat: null },
  { name: 'Bubble Tiger', rarity: 'common', price: 350, income: 12, color: '#ff5e8a', hat: null },
  { name: 'Juicy Apple', rarity: 'common', price: 160, income: 5, color: '#fd79a8', hat: null },
  { name: 'Rainbow Dolphin', rarity: 'common', price: 100, income: 3, color: '#ff5e8a', hat: null },
  { name: 'Shadow Butterfly', rarity: 'common', price: 85, income: 3, color: '#ff6b81', hat: null },
  { name: 'Honey Firefly', rarity: 'common', price: 360, income: 12, color: '#81ecec', hat: null },
  { name: 'Bouncy Unicorn', rarity: 'common', price: 160, income: 5, color: '#f9ca24', hat: null },
  { name: 'Velvet Monkey', rarity: 'common', price: 50, income: 2, color: '#ff7f50', hat: null },
  { name: 'Ocean Guac', rarity: 'common', price: 90, income: 3, color: '#fd79a8', hat: null },
  { name: 'Crystal Mochi', rarity: 'common', price: 100, income: 3, color: '#b2bec3', hat: null },
  { name: 'Mini Sloth', rarity: 'common', price: 110, income: 4, color: '#00b894', hat: null },
  { name: 'Ultra Panda', rarity: 'common', price: 260, income: 9, color: '#70a1ff', hat: null },
  { name: 'Frosty Dog', rarity: 'common', price: 330, income: 11, color: '#a29bfe', hat: null },
  { name: 'Drowsy Ginger', rarity: 'common', price: 170, income: 6, color: '#ffd32a', hat: null },
  { name: 'Fluffy Noodle', rarity: 'common', price: 230, income: 8, color: '#fd79a8', hat: 'bow' },
  { name: 'Cheesy Matcha', rarity: 'common', price: 55, income: 2, color: '#2e86de', hat: null },
  { name: 'Sour Ninja', rarity: 'common', price: 160, income: 5, color: '#ff5e8a', hat: null },
  { name: 'Moonlit Wolf', rarity: 'common', price: 120, income: 4, color: '#1dd1a1', hat: 'bow' },
  { name: 'Jolly Waffle', rarity: 'common', price: 110, income: 4, color: '#00d2d3', hat: null },
  { name: 'Dizzy Burger', rarity: 'common', price: 100, income: 3, color: '#55efc4', hat: null },
  { name: 'Jolly Taco', rarity: 'common', price: 55, income: 2, color: '#74b9ff', hat: null },
  { name: 'Wild Lion', rarity: 'common', price: 280, income: 9, color: '#ff9ff3', hat: null },
  { name: 'Cozy Penguin', rarity: 'common', price: 170, income: 6, color: '#6c5ce7', hat: null },
  { name: 'Fierce Comet', rarity: 'common', price: 470, income: 16, color: '#f368e0', hat: null },
  { name: 'Cosmic Llama', rarity: 'common', price: 480, income: 16, color: '#fab1a0', hat: null },
  { name: 'Moonlit Vampire', rarity: 'common', price: 430, income: 14, color: '#ffa502', hat: null },
  { name: 'Grumpy Peach', rarity: 'common', price: 330, income: 11, color: '#ffa502', hat: null },
  { name: 'Smiley Grape', rarity: 'common', price: 70, income: 2, color: '#eccc68', hat: null },
  { name: 'Zombie Pepper', rarity: 'common', price: 300, income: 10, color: '#5352ed', hat: null },
  { name: 'Smiley Lion', rarity: 'common', price: 130, income: 4, color: '#fdcb6e', hat: null },
  { name: 'Juicy Cookie', rarity: 'common', price: 210, income: 7, color: '#00b894', hat: null },
  { name: 'Tiny Shark', rarity: 'common', price: 110, income: 4, color: '#6c5ce7', hat: null },
  { name: 'Cheesy Peach', rarity: 'common', price: 370, income: 12, color: '#ff4757', hat: null },
  { name: 'Lucky Panda', rarity: 'common', price: 140, income: 5, color: '#55efc4', hat: null },
  { name: 'Glitter Salsa', rarity: 'common', price: 330, income: 11, color: '#6c5ce7', hat: null },
  { name: 'Honey Boba', rarity: 'common', price: 260, income: 9, color: '#ff6b6b', hat: null },
  { name: 'Ocean Toffee', rarity: 'common', price: 50, income: 2, color: '#6c5ce7', hat: null },
  { name: 'Silver Taco', rarity: 'common', price: 230, income: 8, color: '#55efc4', hat: null },
  { name: 'Forest Bear', rarity: 'common', price: 270, income: 9, color: '#f368e0', hat: 'ears' },
  { name: 'Funky Frog', rarity: 'common', price: 280, income: 9, color: '#fdcb6e', hat: null },
  { name: 'Thunder Pancake', rarity: 'common', price: 320, income: 11, color: '#7bed9f', hat: null },
  { name: 'Sneaky Sunbeam', rarity: 'common', price: 350, income: 12, color: '#ff4757', hat: null },
  { name: 'Dizzy Carrot', rarity: 'common', price: 80, income: 3, color: '#e84393', hat: null },
  { name: 'Melty Robot', rarity: 'common', price: 85, income: 3, color: '#74b9ff', hat: null },
  { name: 'Magic Wasabi', rarity: 'common', price: 60, income: 2, color: '#1dd1a1', hat: null },
  { name: 'Chill Owl', rarity: 'common', price: 350, income: 12, color: '#1e90ff', hat: null },
  { name: 'Turbo Owl', rarity: 'common', price: 80, income: 3, color: '#00b894', hat: null },
  { name: 'Dizzy Owl', rarity: 'common', price: 130, income: 4, color: '#ff6b6b', hat: null },
  { name: 'Ninja Alien', rarity: 'common', price: 150, income: 5, color: '#ff4757', hat: null },
  { name: 'Giant Burrito', rarity: 'common', price: 55, income: 2, color: '#b2bec3', hat: null },
  { name: 'Sour Tiger', rarity: 'common', price: 150, income: 5, color: '#feca57', hat: 'ears' },
  { name: 'Desert Gummy', rarity: 'common', price: 130, income: 4, color: '#6c5ce7', hat: null },
  { name: 'Bouncy Star', rarity: 'common', price: 130, income: 4, color: '#f9ca24', hat: null },
  { name: 'Turbo Ninja', rarity: 'common', price: 310, income: 10, color: '#00b894', hat: null },
  { name: 'Velvet Turtle', rarity: 'common', price: 230, income: 8, color: '#ff6b81', hat: null },
  { name: 'Speedy Banana', rarity: 'common', price: 60, income: 2, color: '#1dd1a1', hat: null },
  { name: 'Wacky Sloth', rarity: 'common', price: 300, income: 10, color: '#dfe6e9', hat: null },
  { name: 'Grumpy Mango', rarity: 'common', price: 280, income: 9, color: '#5f27cd', hat: null },
  { name: 'Stormy Starfish', rarity: 'common', price: 120, income: 4, color: '#ffa502', hat: null },
  { name: 'Groovy Pumpkin', rarity: 'common', price: 100, income: 3, color: '#7bed9f', hat: null },
  { name: 'Magic Popcorn', rarity: 'common', price: 80, income: 3, color: '#5f27cd', hat: 'bow' },
  { name: 'Fluffy Panda', rarity: 'common', price: 430, income: 14, color: '#00b894', hat: null },
  { name: 'Happy Comet', rarity: 'common', price: 95, income: 3, color: '#d63031', hat: null },
  { name: 'Super Unicorn', rarity: 'common', price: 110, income: 4, color: '#7b2ff7', hat: null },
  { name: 'Rusty Crab', rarity: 'common', price: 370, income: 12, color: '#fd79a8', hat: null },
  { name: 'Cloudy Marshmallow', rarity: 'common', price: 100, income: 3, color: '#ff4757', hat: null },
  { name: 'Rainbow Bear', rarity: 'common', price: 110, income: 4, color: '#eccc68', hat: null },
  { name: 'Bouncy Seashell', rarity: 'common', price: 160, income: 5, color: '#ff4757', hat: null },
  { name: 'Alien Brownie', rarity: 'common', price: 430, income: 14, color: '#7bed9f', hat: 'bow' },
  { name: 'Zesty Octopus', rarity: 'common', price: 280, income: 9, color: '#a29bfe', hat: null },
  { name: 'Pirate Popcorn', rarity: 'common', price: 420, income: 14, color: '#636e72', hat: null },
  { name: 'Peppermint Duck', rarity: 'common', price: 220, income: 7, color: '#00cec9', hat: null },
  { name: 'Chill Corn', rarity: 'common', price: 120, income: 4, color: '#fd79a8', hat: null },
  { name: 'Frosty Sushi', rarity: 'common', price: 100, income: 3, color: '#74b9ff', hat: null },
  { name: 'Melty Nacho', rarity: 'common', price: 370, income: 12, color: '#a29bfe', hat: null },
  { name: 'Spicy Ginger', rarity: 'common', price: 470, income: 16, color: '#eccc68', hat: null },
  { name: 'Spicy Ghost', rarity: 'common', price: 130, income: 4, color: '#f368e0', hat: null },
  { name: 'Velvet Robot', rarity: 'common', price: 260, income: 9, color: '#5352ed', hat: null },
  { name: 'Shadow Lemon', rarity: 'common', price: 470, income: 16, color: '#fab1a0', hat: null },
  { name: 'Wobbly Grape', rarity: 'common', price: 360, income: 12, color: '#74b9ff', hat: null },
  { name: 'Desert Firefly', rarity: 'common', price: 150, income: 5, color: '#a29bfe', hat: null },
  { name: 'Alien Guac', rarity: 'common', price: 240, income: 8, color: '#ff6b81', hat: null },
  { name: 'Spicy Mermaid', rarity: 'common', price: 50, income: 2, color: '#ff7f50', hat: null },
  { name: 'Ocean Waffle', rarity: 'common', price: 60, income: 2, color: '#ffd32a', hat: null },
  { name: 'Giant Starfish', rarity: 'common', price: 100, income: 3, color: '#ffd32a', hat: 'bow' },
  { name: 'Dizzy Shark', rarity: 'common', price: 60, income: 2, color: '#e84393', hat: null },
  { name: 'Jolly Broccoli', rarity: 'common', price: 320, income: 11, color: '#81ecec', hat: 'ears' },
  { name: 'Chill Star', rarity: 'common', price: 370, income: 12, color: '#81ecec', hat: null },
  { name: 'Silly Pirate', rarity: 'common', price: 220, income: 7, color: '#dfe6e9', hat: null },
  { name: 'Funky Wolf', rarity: 'common', price: 120, income: 4, color: '#6c5ce7', hat: null },
  { name: 'Brave Wizard', rarity: 'common', price: 210, income: 7, color: '#dfe6e9', hat: null },
  { name: 'Rusty Panda', rarity: 'common', price: 250, income: 8, color: '#70a1ff', hat: null },
  { name: 'Lucky Popcorn', rarity: 'common', price: 55, income: 2, color: '#70a1ff', hat: null },
  { name: 'Volcanic Grape', rarity: 'common', price: 80, income: 3, color: '#f368e0', hat: null },
  { name: 'Chill Firefly', rarity: 'common', price: 220, income: 7, color: '#ff4757', hat: null },
  { name: 'Gentle Starfish', rarity: 'common', price: 180, income: 6, color: '#2ed573', hat: null },
  { name: 'Candy Panda', rarity: 'common', price: 160, income: 5, color: '#ffd32a', hat: null },
  { name: 'Jolly Llama', rarity: 'common', price: 220, income: 7, color: '#6c5ce7', hat: null },
  { name: 'Rusty Sunbeam', rarity: 'common', price: 110, income: 4, color: '#f368e0', hat: null },
  { name: 'Fierce Dragon', rarity: 'common', price: 85, income: 3, color: '#55efc4', hat: null },
  { name: 'Sleepy Dragon', rarity: 'common', price: 180, income: 6, color: '#0984e3', hat: 'bow' },
  { name: 'Electric Snowman', rarity: 'common', price: 130, income: 4, color: '#f368e0', hat: null },
  { name: 'Golden Boba', rarity: 'common', price: 370, income: 12, color: '#ff7675', hat: null },
  { name: 'Starry Whale', rarity: 'common', price: 230, income: 8, color: '#55efc4', hat: null },
  { name: 'Tiny Burrito', rarity: 'common', price: 160, income: 5, color: '#81ecec', hat: 'bow' },
  { name: 'Zombie Jelly', rarity: 'common', price: 130, income: 4, color: '#d63031', hat: null },
  { name: 'Brave Salsa', rarity: 'common', price: 420, income: 14, color: '#6c5ce7', hat: 'bow' },
  { name: 'Pirate Dog', rarity: 'common', price: 130, income: 4, color: '#ff5e8a', hat: 'ears' },
  { name: 'Wild Monkey', rarity: 'common', price: 250, income: 8, color: '#636e72', hat: 'bow' },
  { name: 'Magic Seashell', rarity: 'common', price: 70, income: 2, color: '#c56cf0', hat: null },
  { name: 'Ember Monster', rarity: 'common', price: 440, income: 15, color: '#fdcb6e', hat: null },
  { name: 'Cheesy Koala', rarity: 'common', price: 70, income: 2, color: '#e84393', hat: null },
  { name: 'Gentle Cat', rarity: 'common', price: 150, income: 5, color: '#ff6b6b', hat: null },
  { name: 'Cosmic Firefly', rarity: 'common', price: 170, income: 6, color: '#f368e0', hat: null },
  { name: 'Rusty Dragon', rarity: 'common', price: 60, income: 2, color: '#48dbfb', hat: null },
  { name: 'Groovy Burrito', rarity: 'common', price: 160, income: 5, color: '#2ed573', hat: null },
  { name: 'Shiny Frog', rarity: 'common', price: 50, income: 2, color: '#e17055', hat: null },
  { name: 'Crispy Apple', rarity: 'common', price: 65, income: 2, color: '#74b9ff', hat: null },
  { name: 'Super Pancake', rarity: 'common', price: 100, income: 3, color: '#fdcb6e', hat: null },
  { name: 'Mega Moose', rarity: 'common', price: 330, income: 11, color: '#636e72', hat: null },
  { name: 'Drowsy Comet', rarity: 'common', price: 80, income: 3, color: '#1e90ff', hat: null },
  { name: 'Rusty Knight', rarity: 'common', price: 80, income: 3, color: '#636e72', hat: null },
  { name: 'Drowsy Jellyfish', rarity: 'common', price: 290, income: 10, color: '#fdcb6e', hat: 'bow' },
  { name: 'Ninja Spider', rarity: 'common', price: 200, income: 7, color: '#2e86de', hat: null },
  { name: 'Turbo Cocoa', rarity: 'common', price: 290, income: 10, color: '#c56cf0', hat: null },
  { name: 'Mega Octopus', rarity: 'common', price: 390, income: 13, color: '#f368e0', hat: null },
  { name: 'Moonlit Burger', rarity: 'common', price: 120, income: 4, color: '#0984e3', hat: null },
  { name: 'Bouncy Cocoa', rarity: 'common', price: 70, income: 2, color: '#1e90ff', hat: null },
  { name: 'Funky Ninja', rarity: 'common', price: 440, income: 15, color: '#dfe6e9', hat: null },
  { name: 'Funky Pirate', rarity: 'common', price: 50, income: 2, color: '#2ed573', hat: 'bow' },
  { name: 'Cozy Tiger', rarity: 'common', price: 290, income: 10, color: '#ffeaa7', hat: null },
  { name: 'Ultra Boba', rarity: 'common', price: 130, income: 4, color: '#ffa502', hat: null },
  { name: 'Shiny Carrot', rarity: 'common', price: 85, income: 3, color: '#e17055', hat: null },
  { name: 'Wild Bat', rarity: 'common', price: 170, income: 6, color: '#55efc4', hat: null },
  { name: 'Fluffy Boba', rarity: 'common', price: 60, income: 2, color: '#6c5ce7', hat: null },
  { name: 'Bouncy Wasabi', rarity: 'common', price: 380, income: 13, color: '#ff9f43', hat: null },
  { name: 'Forest Firefly', rarity: 'common', price: 230, income: 8, color: '#6c5ce7', hat: null },
  { name: 'Drowsy Pretzel', rarity: 'common', price: 250, income: 8, color: '#f368e0', hat: null },
  { name: 'Tiny Spider', rarity: 'common', price: 55, income: 2, color: '#81ecec', hat: null },
  { name: 'Rusty Owl', rarity: 'common', price: 120, income: 4, color: '#f368e0', hat: null },
  { name: 'Crispy Bear', rarity: 'common', price: 75, income: 2, color: '#7bed9f', hat: null },
  { name: 'Shiny Banana', rarity: 'common', price: 75, income: 2, color: '#ffd32a', hat: null },
  { name: 'Ocean Fries', rarity: 'common', price: 120, income: 4, color: '#48dbfb', hat: null },
  { name: 'Thunder Skeleton', rarity: 'common', price: 280, income: 9, color: '#f368e0', hat: null },
  { name: 'Chill Monkey', rarity: 'common', price: 130, income: 4, color: '#e17055', hat: null },
  { name: 'Cosmic Gummy', rarity: 'common', price: 100, income: 3, color: '#ff6b6b', hat: null },
  { name: 'Sour Fox', rarity: 'common', price: 360, income: 12, color: '#f9ca24', hat: null },
  { name: 'Thunder Alpaca', rarity: 'common', price: 50, income: 2, color: '#fd79a8', hat: null },
  { name: 'Golden Knight', rarity: 'common', price: 85, income: 3, color: '#6c5ce7', hat: null },
  { name: 'Hyper Pizza', rarity: 'common', price: 200, income: 7, color: '#00d2d3', hat: null },
  { name: 'Ember Snake', rarity: 'common', price: 370, income: 12, color: '#6c5ce7', hat: 'bow' },
  { name: 'Brave Moonbeam', rarity: 'common', price: 390, income: 13, color: '#ff4757', hat: null },
  { name: 'Rainbow Starfish', rarity: 'common', price: 60, income: 2, color: '#48dbfb', hat: null },
  { name: 'Dizzy Tiger', rarity: 'common', price: 55, income: 2, color: '#fdcb6e', hat: null },
  { name: 'Thunder Lemon', rarity: 'common', price: 85, income: 3, color: '#48dbfb', hat: null },
  { name: 'Bouncy Latte', rarity: 'common', price: 200, income: 7, color: '#ff5e8a', hat: null },
  { name: 'Jumbo Pig', rarity: 'common', price: 410, income: 14, color: '#ff7f50', hat: null },
  { name: 'Peppermint Burger', rarity: 'common', price: 390, income: 13, color: '#ff6b81', hat: 'ears' },
  { name: 'Happy Butterfly', rarity: 'common', price: 140, income: 5, color: '#d63031', hat: null },
  { name: 'Peppy Bear', rarity: 'common', price: 210, income: 7, color: '#ff5e8a', hat: null },
  { name: 'Spicy Seashell', rarity: 'common', price: 210, income: 7, color: '#0984e3', hat: null },
  { name: 'Bubbly Raindrop', rarity: 'common', price: 55, income: 2, color: '#70a1ff', hat: null },
  { name: 'Glitter Cupcake', rarity: 'common', price: 190, income: 6, color: '#feca57', hat: null },
  { name: 'Royal Pretzel', rarity: 'common', price: 50, income: 2, color: '#7b2ff7', hat: null },
  { name: 'Arctic Pretzel', rarity: 'common', price: 110, income: 4, color: '#70a1ff', hat: null },
  { name: 'Wacky Sushi', rarity: 'common', price: 250, income: 8, color: '#ffa502', hat: null },
  { name: 'Brave Lollipop', rarity: 'common', price: 65, income: 2, color: '#e17055', hat: 'ears' },
  { name: 'Rainbow Wizard', rarity: 'common', price: 280, income: 9, color: '#fab1a0', hat: null },
  { name: 'Grumpy Cat', rarity: 'common', price: 480, income: 16, color: '#74b9ff', hat: null },
  { name: 'Arctic Comet', rarity: 'common', price: 440, income: 15, color: '#b2bec3', hat: 'ears' },
  { name: 'Dizzy Sushi', rarity: 'common', price: 210, income: 7, color: '#5352ed', hat: null },
  { name: 'Ember Rocket', rarity: 'common', price: 80, income: 3, color: '#70a1ff', hat: null },
  { name: 'Mini Noodle', rarity: 'common', price: 110, income: 4, color: '#3ee6c4', hat: null },
  { name: 'Candy Cat', rarity: 'common', price: 230, income: 8, color: '#1e90ff', hat: null },
  { name: 'Volcanic Broccoli', rarity: 'common', price: 240, income: 8, color: '#1e90ff', hat: null },
  { name: 'Peppy Lion', rarity: 'common', price: 85, income: 3, color: '#70a1ff', hat: null },
  { name: 'Bubble Octopus', rarity: 'common', price: 85, income: 3, color: '#636e72', hat: null },
  { name: 'Zombie Pumpkin', rarity: 'common', price: 65, income: 2, color: '#eccc68', hat: null },
  { name: 'Ember Eagle', rarity: 'common', price: 95, income: 3, color: '#00b894', hat: null },
  { name: 'Zombie Fries', rarity: 'common', price: 90, income: 3, color: '#2ed573', hat: null },
  { name: 'Spicy Hotdog', rarity: 'common', price: 210, income: 7, color: '#ff5e8a', hat: 'ears' },
  { name: 'Sunset Rocket', rarity: 'common', price: 460, income: 15, color: '#ff5e8a', hat: null },
  { name: 'Glitter Cocoa', rarity: 'common', price: 110, income: 4, color: '#ff7f50', hat: null },
  { name: 'Salty Moose', rarity: 'common', price: 65, income: 2, color: '#ffeaa7', hat: null },
  { name: 'Lucky Dog', rarity: 'common', price: 65, income: 2, color: '#7b2ff7', hat: null },
  { name: 'Shiny Fries', rarity: 'common', price: 300, income: 10, color: '#f9ca24', hat: 'bow' },
  { name: 'Cloudy Cocoa', rarity: 'common', price: 430, income: 14, color: '#1e90ff', hat: null },
  { name: 'Grumpy Pepper', rarity: 'common', price: 130, income: 4, color: '#636e72', hat: null },
  { name: 'Gentle Salsa', rarity: 'common', price: 55, income: 2, color: '#ff5e8a', hat: null },
  { name: 'Jumbo Pretzel', rarity: 'common', price: 80, income: 3, color: '#2e86de', hat: null },
  { name: 'Velvet Nacho', rarity: 'common', price: 55, income: 2, color: '#dfe6e9', hat: null },
  { name: 'Crispy Latte', rarity: 'common', price: 160, income: 5, color: '#fd79a8', hat: null },
  { name: 'Sunny Ninja', rarity: 'common', price: 340, income: 11, color: '#ff6b81', hat: null },
  { name: 'Wizard Snake', rarity: 'common', price: 310, income: 10, color: '#1dd1a1', hat: 'bow' },
  { name: 'Moonlit Koala', rarity: 'common', price: 55, income: 2, color: '#f368e0', hat: null },
  { name: 'Sleepy Taco', rarity: 'common', price: 80, income: 3, color: '#00b894', hat: null },
  { name: 'Ember Turtle', rarity: 'common', price: 460, income: 15, color: '#a29bfe', hat: null },
  { name: 'Candy Bear', rarity: 'common', price: 310, income: 10, color: '#5f27cd', hat: null },
  { name: 'Starry Bat', rarity: 'common', price: 160, income: 5, color: '#f9ca24', hat: null },
  { name: 'Honey Ninja', rarity: 'common', price: 65, income: 2, color: '#0984e3', hat: null },
  { name: 'Lucky Vampire', rarity: 'common', price: 100, income: 3, color: '#c56cf0', hat: null },
  { name: 'Peppy Pirate', rarity: 'common', price: 130, income: 4, color: '#00b894', hat: 'ears' },
  { name: 'Bubble Dolphin', rarity: 'common', price: 180, income: 6, color: '#5f27cd', hat: null },
  { name: 'Ninja Pancake', rarity: 'common', price: 170, income: 6, color: '#feca57', hat: 'ears' },
  { name: 'Honey Apple', rarity: 'common', price: 90, income: 3, color: '#fab1a0', hat: null },
  { name: 'Super Ghost', rarity: 'common', price: 150, income: 5, color: '#6c5ce7', hat: null },
  { name: 'Rusty Horse', rarity: 'common', price: 270, income: 9, color: '#00d2d3', hat: null },
  { name: 'Super Bee', rarity: 'common', price: 190, income: 6, color: '#7b2ff7', hat: null },
  { name: 'Sneaky Mochi', rarity: 'common', price: 250, income: 8, color: '#55efc4', hat: null },
  { name: 'Cosmic Noodle', rarity: 'common', price: 80, income: 3, color: '#1dd1a1', hat: null },
  { name: 'Sleepy Apple', rarity: 'common', price: 65, income: 2, color: '#dfe6e9', hat: null },
  { name: 'Sweet Dolphin', rarity: 'common', price: 410, income: 14, color: '#ff7675', hat: null },
  { name: 'Crispy Cat', rarity: 'common', price: 310, income: 10, color: '#e17055', hat: null },
  { name: 'Groovy Knight', rarity: 'common', price: 80, income: 3, color: '#70a1ff', hat: null },
  { name: 'Sweet Pumpkin', rarity: 'common', price: 470, income: 16, color: '#feca57', hat: 'bow' },
  { name: 'Royal Chick', rarity: 'common', price: 65, income: 2, color: '#eccc68', hat: 'bow' },
  { name: 'Volcanic Unicorn', rarity: 'common', price: 150, income: 5, color: '#f368e0', hat: 'bow' },
  { name: 'Giant Shark', rarity: 'common', price: 65, income: 2, color: '#ff6b6b', hat: 'bow' },
  { name: 'Chill Pirate', rarity: 'common', price: 140, income: 5, color: '#ff9ff3', hat: null },
  { name: 'Desert Lollipop', rarity: 'common', price: 110, income: 4, color: '#7bed9f', hat: null },
  { name: 'Speedy Dragon', rarity: 'common', price: 70, income: 2, color: '#ff4757', hat: null },
  { name: 'Crispy Alpaca', rarity: 'common', price: 370, income: 12, color: '#70a1ff', hat: null },
  { name: 'Alien Dragon', rarity: 'common', price: 95, income: 3, color: '#6c5ce7', hat: null },
  { name: 'Shiny Cookie', rarity: 'common', price: 110, income: 4, color: '#70a1ff', hat: 'bow' },
  { name: 'Rusty Comet', rarity: 'common', price: 210, income: 7, color: '#ff9f43', hat: null },
  { name: 'Dizzy Octopus', rarity: 'common', price: 300, income: 10, color: '#ff7675', hat: null },
  { name: 'Forest Ginger', rarity: 'common', price: 100, income: 3, color: '#00cec9', hat: 'bow' },
  { name: 'Wild Guac', rarity: 'common', price: 70, income: 2, color: '#a29bfe', hat: null },
  { name: 'Sleepy Burger', rarity: 'common', price: 160, income: 5, color: '#1dd1a1', hat: null },
  { name: 'Midnight Wasabi', rarity: 'common', price: 150, income: 5, color: '#b2bec3', hat: null },
  { name: 'Glitter Dolphin', rarity: 'common', price: 450, income: 15, color: '#74b9ff', hat: null },
  { name: 'Moonlit Apple', rarity: 'common', price: 65, income: 2, color: '#fd79a8', hat: null },
  { name: 'Neon Ramen', rarity: 'common', price: 110, income: 4, color: '#1dd1a1', hat: null },
  { name: 'Wacky Snowflake', rarity: 'common', price: 240, income: 8, color: '#ff9f43', hat: null },
  { name: 'Smiley Cupcake', rarity: 'common', price: 260, income: 9, color: '#ff9ff3', hat: 'bow' },
  { name: 'Zombie Pig', rarity: 'common', price: 380, income: 13, color: '#00b894', hat: null },
  { name: 'Pirate Snake', rarity: 'common', price: 430, income: 14, color: '#70a1ff', hat: 'bow' },
  { name: 'Peppermint Beaver', rarity: 'common', price: 380, income: 13, color: '#7b2ff7', hat: null },
  { name: 'Magic Penguin', rarity: 'common', price: 260, income: 9, color: '#b2bec3', hat: null },
  { name: 'Shiny Snowman', rarity: 'common', price: 90, income: 3, color: '#1e90ff', hat: 'bow' },
  { name: 'Neon Apple', rarity: 'common', price: 260, income: 9, color: '#5f27cd', hat: null },
  { name: 'Crystal Turtle', rarity: 'common', price: 200, income: 7, color: '#00d2d3', hat: null },
  { name: 'Funky Bee', rarity: 'common', price: 440, income: 15, color: '#636e72', hat: 'ears' },
  { name: 'Cloudy Lion', rarity: 'common', price: 160, income: 5, color: '#eccc68', hat: null },
  { name: 'Mini Cupcake', rarity: 'common', price: 330, income: 11, color: '#e84393', hat: null },
  { name: 'Moonlit Peach', rarity: 'common', price: 290, income: 10, color: '#ffeaa7', hat: null },
  { name: 'Tiny Pretzel', rarity: 'common', price: 85, income: 3, color: '#3ee6c4', hat: null },
  { name: 'Moonlit Chick', rarity: 'common', price: 65, income: 2, color: '#e17055', hat: null },
  { name: 'Golden Cat', rarity: 'common', price: 460, income: 15, color: '#ff7f50', hat: null },
  { name: 'Sunny Zombie', rarity: 'common', price: 220, income: 7, color: '#ff6b6b', hat: 'ears' },
  { name: 'Wacky Mochi', rarity: 'common', price: 200, income: 7, color: '#1dd1a1', hat: null },
  { name: 'Shadow Wizard', rarity: 'common', price: 180, income: 6, color: '#6c5ce7', hat: 'ears' },
  { name: 'Smiley Horse', rarity: 'common', price: 60, income: 2, color: '#ff9f43', hat: null },
  { name: 'Desert Moonbeam', rarity: 'common', price: 75, income: 2, color: '#1e90ff', hat: null },
  { name: 'Sneaky Bunny', rarity: 'common', price: 80, income: 3, color: '#e17055', hat: null },
  { name: 'Jolly Melon', rarity: 'common', price: 90, income: 3, color: '#6c5ce7', hat: null },
  { name: 'Frosty Pickle', rarity: 'common', price: 340, income: 11, color: '#ff9ff3', hat: null },
  { name: 'Crispy Taco', rarity: 'common', price: 290, income: 10, color: '#e17055', hat: null },
  { name: 'Happy Corn', rarity: 'common', price: 360, income: 12, color: '#70a1ff', hat: null },
  { name: 'Jumbo Dolphin', rarity: 'common', price: 80, income: 3, color: '#f9ca24', hat: null },
  { name: 'Sleepy Ghost', rarity: 'common', price: 310, income: 10, color: '#fab1a0', hat: null },
  { name: 'Brave Ginger', rarity: 'common', price: 480, income: 16, color: '#f368e0', hat: null },
  { name: 'Jolly Ghost', rarity: 'common', price: 140, income: 5, color: '#eccc68', hat: null },
  { name: 'Stormy Cat', rarity: 'common', price: 120, income: 4, color: '#feca57', hat: null },
  { name: 'Cheesy Ghost', rarity: 'common', price: 270, income: 9, color: '#ff5e8a', hat: null },
  { name: 'Golden Eagle', rarity: 'common', price: 210, income: 7, color: '#00b894', hat: null },
  { name: 'Peppy Noodle', rarity: 'common', price: 280, income: 9, color: '#ff9f43', hat: null },
  { name: 'Peppy Skeleton', rarity: 'common', price: 320, income: 11, color: '#fab1a0', hat: null },
  { name: 'Silver Vampire', rarity: 'common', price: 55, income: 2, color: '#fd79a8', hat: null },
  { name: 'Glitter Grape', rarity: 'common', price: 130, income: 4, color: '#ffd32a', hat: null },
  { name: 'Pirate Pudding', rarity: 'common', price: 150, income: 5, color: '#0984e3', hat: null },
  { name: 'Wacky Boba', rarity: 'common', price: 220, income: 7, color: '#00d2d3', hat: null },
  { name: 'Cosmic Fox', rarity: 'common', price: 250, income: 8, color: '#3ee6c4', hat: 'bow' },
  { name: 'Ultra Nacho', rarity: 'common', price: 170, income: 6, color: '#f9ca24', hat: null },
  { name: 'Spicy Pepper', rarity: 'common', price: 170, income: 6, color: '#fdcb6e', hat: null },
  { name: 'Sleepy Marshmallow', rarity: 'common', price: 190, income: 6, color: '#ff9ff3', hat: null },
  { name: 'Funky Moonbeam', rarity: 'common', price: 55, income: 2, color: '#ff6b6b', hat: null },
  { name: 'Jolly Apple', rarity: 'common', price: 50, income: 2, color: '#ffd32a', hat: null },
  { name: 'Groovy Peach', rarity: 'common', price: 150, income: 5, color: '#74b9ff', hat: null },
  { name: 'Grumpy Butterfly', rarity: 'common', price: 75, income: 2, color: '#1dd1a1', hat: null },
  { name: 'Alien Bat', rarity: 'common', price: 110, income: 4, color: '#e17055', hat: 'ears' },
  { name: 'Sweet Lion', rarity: 'common', price: 340, income: 11, color: '#1e90ff', hat: null },
  { name: 'Ember Waffle', rarity: 'common', price: 270, income: 9, color: '#ff7f50', hat: null },
  { name: 'Alien Vampire', rarity: 'common', price: 110, income: 4, color: '#fab1a0', hat: null },
  { name: 'Mega Jelly', rarity: 'common', price: 360, income: 12, color: '#1dd1a1', hat: null },
  { name: 'Jolly Monkey', rarity: 'common', price: 290, income: 10, color: '#ff6b6b', hat: null },
  { name: 'Cheesy Bee', rarity: 'common', price: 55, income: 2, color: '#00cec9', hat: null },
  { name: 'Velvet Fox', rarity: 'common', price: 65, income: 2, color: '#74b9ff', hat: null },
  { name: 'Salty Fries', rarity: 'common', price: 50, income: 2, color: '#ff7675', hat: null },
  { name: 'Volcanic Mango', rarity: 'common', price: 65, income: 2, color: '#f368e0', hat: null },
  { name: 'Dizzy Moonbeam', rarity: 'common', price: 360, income: 12, color: '#ff9f43', hat: null },
  { name: 'Starry Raindrop', rarity: 'common', price: 190, income: 6, color: '#c56cf0', hat: null },
  { name: 'Velvet Pizza', rarity: 'common', price: 440, income: 15, color: '#ff9f43', hat: null },
  { name: 'Peppermint Cow', rarity: 'common', price: 310, income: 10, color: '#f368e0', hat: null },
  { name: 'Candy Toffee', rarity: 'common', price: 220, income: 7, color: '#d63031', hat: null },
  { name: 'Zombie Penguin', rarity: 'common', price: 260, income: 9, color: '#feca57', hat: null },
  { name: 'Royal Frog', rarity: 'common', price: 90, income: 3, color: '#ff4757', hat: null },
  { name: 'Magic Muffin', rarity: 'common', price: 110, income: 4, color: '#2ed573', hat: null },
  { name: 'Fluffy Penguin', rarity: 'common', price: 340, income: 11, color: '#3ee6c4', hat: null },
  { name: 'Rainbow Banana', rarity: 'common', price: 450, income: 15, color: '#b2bec3', hat: null },
  { name: 'Wobbly Bunny', rarity: 'common', price: 50, income: 2, color: '#ff5e8a', hat: null },
  { name: 'Super Ninja', rarity: 'common', price: 290, income: 10, color: '#0984e3', hat: null },
  { name: 'Rainbow Cat', rarity: 'common', price: 100, income: 3, color: '#eccc68', hat: null },
  { name: 'Shadow Guac', rarity: 'common', price: 460, income: 15, color: '#ff9ff3', hat: null },
  { name: 'Glitter Pizza', rarity: 'common', price: 240, income: 8, color: '#5352ed', hat: 'ears' },
  { name: 'Melty Pudding', rarity: 'common', price: 330, income: 11, color: '#5f27cd', hat: null },
  { name: 'Candy Owl', rarity: 'common', price: 160, income: 5, color: '#70a1ff', hat: null },
  { name: 'Salty Llama', rarity: 'common', price: 370, income: 12, color: '#ff6b6b', hat: null },
  { name: 'Rainbow Duck', rarity: 'common', price: 50, income: 2, color: '#00d2d3', hat: null },
  { name: 'Happy Lemon', rarity: 'common', price: 270, income: 9, color: '#70a1ff', hat: null },
  { name: 'Crystal Noodle', rarity: 'rare', price: 1400, income: 47, color: '#feca57', hat: null },
  { name: 'Sneaky Salsa', rarity: 'rare', price: 560, income: 19, color: '#48dbfb', hat: null },
  { name: 'Shiny Melon', rarity: 'rare', price: 1850, income: 62, color: '#ff7675', hat: 'ears' },
  { name: 'Desert Fox', rarity: 'rare', price: 1600, income: 53, color: '#1dd1a1', hat: 'sparkle' },
  { name: 'Starry Alien', rarity: 'rare', price: 880, income: 29, color: '#ff6b81', hat: null },
  { name: 'Jumbo Horse', rarity: 'rare', price: 880, income: 29, color: '#ff6b81', hat: null },
  { name: 'Smiley Dog', rarity: 'rare', price: 570, income: 19, color: '#00b894', hat: null },
  { name: 'Starry Pizza', rarity: 'rare', price: 430, income: 14, color: '#f9ca24', hat: 'ears' },
  { name: 'Cosmic Waffle', rarity: 'rare', price: 1400, income: 47, color: '#3ee6c4', hat: null },
  { name: 'Thunder Knight', rarity: 'rare', price: 650, income: 22, color: '#fdcb6e', hat: 'ears' },
  { name: 'Lucky Cherry', rarity: 'rare', price: 1150, income: 38, color: '#55efc4', hat: null },
  { name: 'Alien Fox', rarity: 'rare', price: 760, income: 25, color: '#5352ed', hat: null },
  { name: 'Stormy Apple', rarity: 'rare', price: 960, income: 32, color: '#e84393', hat: null },
  { name: 'Magic Ninja', rarity: 'rare', price: 740, income: 25, color: '#eccc68', hat: 'bow' },
  { name: 'Stormy Taco', rarity: 'rare', price: 1150, income: 38, color: '#eccc68', hat: null },
  { name: 'Melty Guac', rarity: 'rare', price: 860, income: 29, color: '#1dd1a1', hat: null },
  { name: 'Zombie Snowman', rarity: 'rare', price: 860, income: 29, color: '#fdcb6e', hat: 'sparkle' },
  { name: 'Cozy Frog', rarity: 'rare', price: 640, income: 21, color: '#f368e0', hat: null },
  { name: 'Sunny Eagle', rarity: 'rare', price: 420, income: 14, color: '#fdcb6e', hat: 'bow' },
  { name: 'Pirate Monkey', rarity: 'rare', price: 1250, income: 42, color: '#2e86de', hat: 'bow' },
  { name: 'Candy Ninja', rarity: 'rare', price: 1550, income: 52, color: '#ff9f43', hat: 'sparkle' },
  { name: 'Bubble Bear', rarity: 'rare', price: 410, income: 14, color: '#6c5ce7', hat: null },
  { name: 'Juicy Corn', rarity: 'rare', price: 500, income: 17, color: '#7bed9f', hat: null },
  { name: 'Super Jellyfish', rarity: 'rare', price: 1550, income: 52, color: '#fab1a0', hat: null },
  { name: 'Shadow Crab', rarity: 'rare', price: 1700, income: 57, color: '#6c5ce7', hat: 'bow' },
  { name: 'Cloudy Zombie', rarity: 'rare', price: 1200, income: 40, color: '#a29bfe', hat: null },
  { name: 'Cosmic Fries', rarity: 'rare', price: 830, income: 28, color: '#a29bfe', hat: null },
  { name: 'Groovy Zombie', rarity: 'rare', price: 890, income: 30, color: '#ffd32a', hat: null },
  { name: 'Alien Pizza', rarity: 'rare', price: 580, income: 19, color: '#ff9f43', hat: 'bow' },
  { name: 'Juicy Rocket', rarity: 'rare', price: 1750, income: 58, color: '#5f27cd', hat: null },
  { name: 'Hyper Toffee', rarity: 'rare', price: 440, income: 15, color: '#ff9f43', hat: null },
  { name: 'Bouncy Waffle', rarity: 'rare', price: 830, income: 28, color: '#55efc4', hat: null },
  { name: 'Cheesy Sloth', rarity: 'rare', price: 1450, income: 48, color: '#5352ed', hat: null },
  { name: 'Cloudy Monster', rarity: 'rare', price: 1450, income: 48, color: '#ff6b6b', hat: 'sparkle' },
  { name: 'Candy Firefly', rarity: 'rare', price: 1400, income: 47, color: '#00d2d3', hat: 'sparkle' },
  { name: 'Rainbow Moose', rarity: 'rare', price: 1250, income: 42, color: '#f9ca24', hat: null },
  { name: 'Sneaky Monster', rarity: 'rare', price: 1850, income: 62, color: '#ff6b6b', hat: null },
  { name: 'Peppy Cookie', rarity: 'rare', price: 980, income: 33, color: '#74b9ff', hat: 'sparkle' },
  { name: 'Mega Marshmallow', rarity: 'rare', price: 1600, income: 53, color: '#dfe6e9', hat: null },
  { name: 'Honey Pancake', rarity: 'rare', price: 670, income: 22, color: '#ff5e8a', hat: null },
  { name: 'Peppermint Turtle', rarity: 'rare', price: 500, income: 17, color: '#ff6b6b', hat: 'sparkle' },
  { name: 'Ultra Alien', rarity: 'rare', price: 1750, income: 58, color: '#1e90ff', hat: null },
  { name: 'Alien Taco', rarity: 'rare', price: 470, income: 16, color: '#f368e0', hat: null },
  { name: 'Thunder Toffee', rarity: 'rare', price: 1450, income: 48, color: '#ff5e8a', hat: null },
  { name: 'Rusty Tiger', rarity: 'rare', price: 1350, income: 45, color: '#00d2d3', hat: null },
  { name: 'Super Snowflake', rarity: 'rare', price: 1300, income: 43, color: '#e84393', hat: null },
  { name: 'Neon Cherry', rarity: 'rare', price: 590, income: 20, color: '#fd79a8', hat: 'ears' },
  { name: 'Peppy Alien', rarity: 'rare', price: 1300, income: 43, color: '#2e86de', hat: null },
  { name: 'Mega Llama', rarity: 'rare', price: 1250, income: 42, color: '#fd79a8', hat: 'sparkle' },
  { name: 'Gentle Mochi', rarity: 'rare', price: 1200, income: 40, color: '#dfe6e9', hat: null },
  { name: 'Ninja Pickle', rarity: 'rare', price: 1900, income: 63, color: '#ff6b81', hat: null },
  { name: 'Smiley Mermaid', rarity: 'rare', price: 1900, income: 63, color: '#fab1a0', hat: null },
  { name: 'Turbo Snowflake', rarity: 'rare', price: 480, income: 16, color: '#e84393', hat: null },
  { name: 'Royal Bear', rarity: 'rare', price: 860, income: 29, color: '#fab1a0', hat: null },
  { name: 'Sweet Ghost', rarity: 'rare', price: 670, income: 22, color: '#f368e0', hat: 'bow' },
  { name: 'Sour Gummy', rarity: 'rare', price: 680, income: 23, color: '#b2bec3', hat: 'sparkle' },
  { name: 'Dizzy Turtle', rarity: 'rare', price: 1200, income: 40, color: '#ffeaa7', hat: 'sparkle' },
  { name: 'Fluffy Peach', rarity: 'rare', price: 740, income: 25, color: '#74b9ff', hat: 'sparkle' },
  { name: 'Sunset Butterfly', rarity: 'rare', price: 1000, income: 33, color: '#ff4757', hat: 'ears' },
  { name: 'Sleepy Cow', rarity: 'rare', price: 1450, income: 48, color: '#ff9ff3', hat: null },
  { name: 'Cozy Raindrop', rarity: 'rare', price: 1700, income: 57, color: '#636e72', hat: null },
  { name: 'Frosty Lion', rarity: 'rare', price: 1500, income: 50, color: '#7bed9f', hat: null },
  { name: 'Bubbly Burger', rarity: 'rare', price: 490, income: 16, color: '#b2bec3', hat: 'bow' },
  { name: 'Arctic Whale', rarity: 'rare', price: 1150, income: 38, color: '#b2bec3', hat: null },
  { name: 'Fluffy Sloth', rarity: 'rare', price: 1500, income: 50, color: '#5f27cd', hat: null },
  { name: 'Bouncy Mango', rarity: 'rare', price: 900, income: 30, color: '#6c5ce7', hat: 'ears' },
  { name: 'Royal Dragon', rarity: 'rare', price: 440, income: 15, color: '#ff7f50', hat: null },
  { name: 'Lucky Horse', rarity: 'rare', price: 700, income: 23, color: '#1dd1a1', hat: null },
  { name: 'Shiny Cherry', rarity: 'rare', price: 410, income: 14, color: '#00d2d3', hat: 'sparkle' },
  { name: 'Brave Toffee', rarity: 'rare', price: 1100, income: 37, color: '#a29bfe', hat: null },
  { name: 'Sunset Gummy', rarity: 'rare', price: 1150, income: 38, color: '#ff7675', hat: null },
  { name: 'Arctic Carrot', rarity: 'rare', price: 1650, income: 55, color: '#6c5ce7', hat: 'ears' },
  { name: 'Wizard Burger', rarity: 'rare', price: 540, income: 18, color: '#1e90ff', hat: null },
  { name: 'Smiley Latte', rarity: 'rare', price: 840, income: 28, color: '#ffd32a', hat: 'sparkle' },
  { name: 'Jolly Firefly', rarity: 'rare', price: 1250, income: 42, color: '#ff9f43', hat: 'ears' },
  { name: 'Sweet Mango', rarity: 'rare', price: 1700, income: 57, color: '#b2bec3', hat: null },
  { name: 'Shadow Waffle', rarity: 'rare', price: 2000, income: 67, color: '#74b9ff', hat: null },
  { name: 'Sour Pancake', rarity: 'rare', price: 730, income: 24, color: '#ff4757', hat: null },
  { name: 'Electric Wasabi', rarity: 'rare', price: 780, income: 26, color: '#1dd1a1', hat: null },
  { name: 'Turbo Beaver', rarity: 'rare', price: 490, income: 16, color: '#c56cf0', hat: null },
  { name: 'Sour Donut', rarity: 'rare', price: 480, income: 16, color: '#d63031', hat: null },
  { name: 'Bubble Pig', rarity: 'rare', price: 1400, income: 47, color: '#e84393', hat: null },
  { name: 'Thunder Alien', rarity: 'rare', price: 1450, income: 48, color: '#2ed573', hat: 'ears' },
  { name: 'Mega Snake', rarity: 'rare', price: 560, income: 19, color: '#00d2d3', hat: null },
  { name: 'Moonlit Seashell', rarity: 'rare', price: 1100, income: 37, color: '#dfe6e9', hat: 'ears' },
  { name: 'Sour Moonbeam', rarity: 'rare', price: 670, income: 22, color: '#2ed573', hat: 'bow' },
  { name: 'Rusty Snake', rarity: 'rare', price: 1150, income: 38, color: '#fd79a8', hat: null },
  { name: 'Bouncy Cow', rarity: 'rare', price: 580, income: 19, color: '#ff6b81', hat: null },
  { name: 'Happy Starfish', rarity: 'rare', price: 420, income: 14, color: '#00d2d3', hat: null },
  { name: 'Lucky Melon', rarity: 'rare', price: 930, income: 31, color: '#dfe6e9', hat: 'sparkle' },
  { name: 'Spicy Brownie', rarity: 'rare', price: 810, income: 27, color: '#b2bec3', hat: null },
  { name: 'Neon Carrot', rarity: 'rare', price: 730, income: 24, color: '#ff6b6b', hat: null },
  { name: 'Bubbly Snake', rarity: 'rare', price: 910, income: 30, color: '#ff9ff3', hat: 'bow' },
  { name: 'Arctic Cookie', rarity: 'rare', price: 700, income: 23, color: '#5352ed', hat: 'ears' },
  { name: 'Jolly Skeleton', rarity: 'rare', price: 1300, income: 43, color: '#6c5ce7', hat: 'sparkle' },
  { name: 'Juicy Hotdog', rarity: 'rare', price: 1550, income: 52, color: '#eccc68', hat: null },
  { name: 'Velvet Salsa', rarity: 'rare', price: 860, income: 29, color: '#3ee6c4', hat: null },
  { name: 'Volcanic Bear', rarity: 'rare', price: 530, income: 18, color: '#0984e3', hat: null },
  { name: 'Shiny Boba', rarity: 'rare', price: 1200, income: 40, color: '#a29bfe', hat: 'sparkle' },
  { name: 'Shiny Waffle', rarity: 'rare', price: 1150, income: 38, color: '#1dd1a1', hat: null },
  { name: 'Arctic Popcorn', rarity: 'rare', price: 420, income: 14, color: '#7b2ff7', hat: 'ears' },
  { name: 'Silly Pumpkin', rarity: 'rare', price: 460, income: 15, color: '#eccc68', hat: 'bow' },
  { name: 'Ninja Skeleton', rarity: 'rare', price: 550, income: 18, color: '#ff6b81', hat: 'bow' },
  { name: 'Jolly Jellyfish', rarity: 'rare', price: 500, income: 17, color: '#3ee6c4', hat: null },
  { name: 'Ember Sushi', rarity: 'rare', price: 480, income: 16, color: '#2ed573', hat: null },
  { name: 'Chill Apple', rarity: 'rare', price: 1450, income: 48, color: '#e84393', hat: 'sparkle' },
  { name: 'Zesty Turtle', rarity: 'rare', price: 1150, income: 38, color: '#ff4757', hat: null },
  { name: 'Mini Wizard', rarity: 'rare', price: 990, income: 33, color: '#fdcb6e', hat: 'sparkle' },
  { name: 'Mini Pumpkin', rarity: 'rare', price: 1500, income: 50, color: '#5f27cd', hat: 'sparkle' },
  { name: 'Mini Dolphin', rarity: 'rare', price: 1000, income: 33, color: '#5352ed', hat: null },
  { name: 'Tiny Burger', rarity: 'rare', price: 1150, income: 38, color: '#81ecec', hat: null },
  { name: 'Glitter Matcha', rarity: 'rare', price: 1350, income: 45, color: '#fd79a8', hat: null },
  { name: 'Royal Pickle', rarity: 'rare', price: 1600, income: 53, color: '#f368e0', hat: null },
  { name: 'Ninja Moonbeam', rarity: 'rare', price: 940, income: 31, color: '#d63031', hat: null },
  { name: 'Chill Fox', rarity: 'rare', price: 510, income: 17, color: '#ff7675', hat: null },
  { name: 'Juicy Pig', rarity: 'rare', price: 490, income: 16, color: '#0984e3', hat: 'ears' },
  { name: 'Starry Marshmallow', rarity: 'rare', price: 1700, income: 57, color: '#f368e0', hat: null },
  { name: 'Happy Dragon', rarity: 'rare', price: 490, income: 16, color: '#ff7675', hat: 'sparkle' },
  { name: 'Frosty Sunbeam', rarity: 'rare', price: 1800, income: 60, color: '#c56cf0', hat: null },
  { name: 'Arctic Lemon', rarity: 'rare', price: 950, income: 32, color: '#fdcb6e', hat: null },
  { name: 'Ocean Salsa', rarity: 'rare', price: 710, income: 24, color: '#70a1ff', hat: 'sparkle' },
  { name: 'Sour Salsa', rarity: 'rare', price: 1850, income: 62, color: '#00b894', hat: null },
  { name: 'Crystal Banana', rarity: 'rare', price: 890, income: 30, color: '#ff4757', hat: null },
  { name: 'Gentle Koala', rarity: 'rare', price: 420, income: 14, color: '#ff6b6b', hat: null },
  { name: 'Ninja Bat', rarity: 'rare', price: 700, income: 23, color: '#6c5ce7', hat: null },
  { name: 'Starry Sushi', rarity: 'rare', price: 760, income: 25, color: '#0984e3', hat: null },
  { name: 'Neon Snowflake', rarity: 'rare', price: 1100, income: 37, color: '#ffeaa7', hat: null },
  { name: 'Royal Monster', rarity: 'rare', price: 1050, income: 35, color: '#d63031', hat: null },
  { name: 'Gentle Dragon', rarity: 'rare', price: 1550, income: 52, color: '#70a1ff', hat: null },
  { name: 'Shadow Alpaca', rarity: 'rare', price: 530, income: 18, color: '#e84393', hat: 'ears' },
  { name: 'Shadow Seashell', rarity: 'rare', price: 650, income: 22, color: '#fd79a8', hat: null },
  { name: 'Electric Penguin', rarity: 'rare', price: 410, income: 14, color: '#00b894', hat: null },
  { name: 'Wobbly Taco', rarity: 'rare', price: 500, income: 17, color: '#5352ed', hat: null },
  { name: 'Zesty Wizard', rarity: 'rare', price: 910, income: 30, color: '#fdcb6e', hat: null },
  { name: 'Silly Jellyfish', rarity: 'rare', price: 420, income: 14, color: '#fd79a8', hat: null },
  { name: 'Golden Dolphin', rarity: 'rare', price: 1550, income: 52, color: '#ff6b81', hat: null },
  { name: 'Happy Carrot', rarity: 'rare', price: 970, income: 32, color: '#0984e3', hat: null },
  { name: 'Thunder Broccoli', rarity: 'rare', price: 450, income: 15, color: '#6c5ce7', hat: 'sparkle' },
  { name: 'Crystal Lollipop', rarity: 'rare', price: 710, income: 24, color: '#f368e0', hat: 'bow' },
  { name: 'Turbo Taco', rarity: 'rare', price: 1350, income: 45, color: '#48dbfb', hat: 'sparkle' },
  { name: 'Golden Noodle', rarity: 'rare', price: 1150, income: 38, color: '#5f27cd', hat: 'ears' },
  { name: 'Turbo Snake', rarity: 'rare', price: 490, income: 16, color: '#ff9f43', hat: null },
  { name: 'Peppermint Ninja', rarity: 'rare', price: 500, income: 17, color: '#fab1a0', hat: null },
  { name: 'Arctic Matcha', rarity: 'rare', price: 1000, income: 33, color: '#ff7675', hat: 'bow' },
  { name: 'Cloudy Comet', rarity: 'rare', price: 840, income: 28, color: '#6c5ce7', hat: null },
  { name: 'Frosty Koala', rarity: 'rare', price: 420, income: 14, color: '#ff7f50', hat: null },
  { name: 'Zesty Banana', rarity: 'rare', price: 1750, income: 58, color: '#1e90ff', hat: null },
  { name: 'Jumbo Bunny', rarity: 'rare', price: 670, income: 22, color: '#ff6b6b', hat: null },
  { name: 'Sunset Salsa', rarity: 'rare', price: 910, income: 30, color: '#7b2ff7', hat: 'ears' },
  { name: 'Hyper Snowflake', rarity: 'rare', price: 920, income: 31, color: '#ff5e8a', hat: 'sparkle' },
  { name: 'Cozy Octopus', rarity: 'rare', price: 1050, income: 35, color: '#c56cf0', hat: 'bow' },
  { name: 'Starry Tiger', rarity: 'rare', price: 740, income: 25, color: '#00d2d3', hat: null },
  { name: 'Mega Koala', rarity: 'rare', price: 1300, income: 43, color: '#2e86de', hat: 'sparkle' },
  { name: 'Cozy Starfish', rarity: 'rare', price: 680, income: 23, color: '#81ecec', hat: null },
  { name: 'Wacky Llama', rarity: 'rare', price: 880, income: 29, color: '#ffd32a', hat: 'sparkle' },
  { name: 'Pirate Snowman', rarity: 'rare', price: 1700, income: 57, color: '#6c5ce7', hat: 'sparkle' },
  { name: 'Tiny Cow', rarity: 'rare', price: 430, income: 14, color: '#e17055', hat: null },
  { name: 'Mega Sushi', rarity: 'rare', price: 420, income: 14, color: '#fdcb6e', hat: 'bow' },
  { name: 'Peppermint Matcha', rarity: 'rare', price: 1600, income: 53, color: '#f9ca24', hat: 'bow' },
  { name: 'Funky Pancake', rarity: 'rare', price: 410, income: 14, color: '#ff6b6b', hat: 'bow' },
  { name: 'Moonlit Hotdog', rarity: 'rare', price: 420, income: 14, color: '#ff9f43', hat: null },
  { name: 'Pirate Koala', rarity: 'rare', price: 790, income: 26, color: '#636e72', hat: null },
  { name: 'Sunset Frog', rarity: 'rare', price: 860, income: 29, color: '#c56cf0', hat: null },
  { name: 'Hyper Sloth', rarity: 'rare', price: 680, income: 23, color: '#feca57', hat: 'sparkle' },
  { name: 'Desert Nacho', rarity: 'rare', price: 1950, income: 65, color: '#a29bfe', hat: null },
  { name: 'Fierce Ninja', rarity: 'rare', price: 1300, income: 43, color: '#48dbfb', hat: 'sparkle' },
  { name: 'Rusty Dog', rarity: 'rare', price: 1200, income: 40, color: '#1e90ff', hat: null },
  { name: 'Zombie Mango', rarity: 'rare', price: 470, income: 16, color: '#ff5e8a', hat: null },
  { name: 'Mega Unicorn', rarity: 'rare', price: 920, income: 31, color: '#00cec9', hat: null },
  { name: 'Sunset Monkey', rarity: 'rare', price: 1800, income: 60, color: '#1dd1a1', hat: null },
  { name: 'Bouncy Lollipop', rarity: 'rare', price: 910, income: 30, color: '#ffeaa7', hat: 'ears' },
  { name: 'Moonlit Mermaid', rarity: 'rare', price: 1550, income: 52, color: '#6c5ce7', hat: null },
  { name: 'Cheesy Mochi', rarity: 'rare', price: 800, income: 27, color: '#ff6b6b', hat: null },
  { name: 'Rusty Marshmallow', rarity: 'rare', price: 1800, income: 60, color: '#0984e3', hat: 'bow' },
  { name: 'Fluffy Banana', rarity: 'rare', price: 400, income: 13, color: '#f9ca24', hat: 'ears' },
  { name: 'Silly Alien', rarity: 'rare', price: 1900, income: 63, color: '#ff4757', hat: null },
  { name: 'Glitter Lemon', rarity: 'rare', price: 1000, income: 33, color: '#2ed573', hat: null },
  { name: 'Neon Alpaca', rarity: 'rare', price: 950, income: 32, color: '#feca57', hat: null },
  { name: 'Shiny Noodle', rarity: 'rare', price: 1500, income: 50, color: '#ff7f50', hat: null },
  { name: 'Desert Fries', rarity: 'rare', price: 890, income: 30, color: '#74b9ff', hat: 'bow' },
  { name: 'Mega Boba', rarity: 'rare', price: 1150, income: 38, color: '#ffeaa7', hat: null },
  { name: 'Alien Mermaid', rarity: 'rare', price: 980, income: 33, color: '#ff6b81', hat: null },
  { name: 'Bouncy Broccoli', rarity: 'rare', price: 410, income: 14, color: '#3ee6c4', hat: null },
  { name: 'Ultra Waffle', rarity: 'rare', price: 460, income: 15, color: '#55efc4', hat: null },
  { name: 'Peppy Ginger', rarity: 'rare', price: 2000, income: 67, color: '#d63031', hat: 'ears' },
  { name: 'Shadow Panda', rarity: 'rare', price: 970, income: 32, color: '#00cec9', hat: null },
  { name: 'Volcanic Dragon', rarity: 'rare', price: 1950, income: 65, color: '#ff7f50', hat: null },
  { name: 'Wobbly Jellyfish', rarity: 'rare', price: 420, income: 14, color: '#ff6b6b', hat: null },
  { name: 'Sour Spider', rarity: 'rare', price: 740, income: 25, color: '#eccc68', hat: null },
  { name: 'Silly Wolf', rarity: 'rare', price: 990, income: 33, color: '#ff6b6b', hat: null },
  { name: 'Sunset Turtle', rarity: 'rare', price: 1500, income: 50, color: '#2e86de', hat: 'sparkle' },
  { name: 'Starry Cocoa', rarity: 'rare', price: 410, income: 14, color: '#2ed573', hat: null },
  { name: 'Juicy Starfish', rarity: 'rare', price: 1400, income: 47, color: '#d63031', hat: null },
  { name: 'Moonlit Lollipop', rarity: 'rare', price: 1650, income: 55, color: '#d63031', hat: 'ears' },
  { name: 'Groovy Monkey', rarity: 'rare', price: 610, income: 20, color: '#eccc68', hat: 'ears' },
  { name: 'Cheesy Bunny', rarity: 'rare', price: 710, income: 24, color: '#2ed573', hat: 'ears' },
  { name: 'Cheesy Lemon', rarity: 'rare', price: 1700, income: 57, color: '#ff6b81', hat: null },
  { name: 'Juicy Cow', rarity: 'rare', price: 540, income: 18, color: '#70a1ff', hat: 'sparkle' },
  { name: 'Chill Lollipop', rarity: 'rare', price: 1850, income: 62, color: '#d63031', hat: null },
  { name: 'Zombie Raindrop', rarity: 'rare', price: 660, income: 22, color: '#e17055', hat: 'bow' },
  { name: 'Speedy Peach', rarity: 'rare', price: 620, income: 21, color: '#48dbfb', hat: 'ears' },
  { name: 'Sunset Alpaca', rarity: 'rare', price: 960, income: 32, color: '#ffa502', hat: 'bow' },
  { name: 'Jolly Dragon', rarity: 'rare', price: 870, income: 29, color: '#e84393', hat: null },
  { name: 'Candy Snowman', rarity: 'rare', price: 1550, income: 52, color: '#c56cf0', hat: null },
  { name: 'Turbo Dog', rarity: 'rare', price: 1100, income: 37, color: '#eccc68', hat: null },
  { name: 'Silly Burrito', rarity: 'rare', price: 770, income: 26, color: '#fab1a0', hat: null },
  { name: 'Wacky Beaver', rarity: 'rare', price: 1600, income: 53, color: '#ffa502', hat: 'ears' },
  { name: 'Hyper Whale', rarity: 'rare', price: 1300, income: 43, color: '#1dd1a1', hat: null },
  { name: 'Jumbo Zombie', rarity: 'rare', price: 1150, income: 38, color: '#ffd32a', hat: 'bow' },
  { name: 'Bubble Brownie', rarity: 'rare', price: 550, income: 18, color: '#ff6b81', hat: null },
  { name: 'Happy Sloth', rarity: 'rare', price: 1300, income: 43, color: '#ffa502', hat: null },
  { name: 'Dizzy Pickle', rarity: 'rare', price: 1950, income: 65, color: '#dfe6e9', hat: null },
  { name: 'Forest Fries', rarity: 'rare', price: 880, income: 29, color: '#74b9ff', hat: null },
  { name: 'Silly Carrot', rarity: 'rare', price: 420, income: 14, color: '#0984e3', hat: null },
  { name: 'Shadow Snake', rarity: 'rare', price: 1500, income: 50, color: '#1dd1a1', hat: null },
  { name: 'Ocean Monster', rarity: 'rare', price: 810, income: 27, color: '#fab1a0', hat: null },
  { name: 'Forest Chick', rarity: 'rare', price: 950, income: 32, color: '#c56cf0', hat: null },
  { name: 'Wobbly Snake', rarity: 'rare', price: 940, income: 31, color: '#ffeaa7', hat: null },
  { name: 'Ultra Star', rarity: 'rare', price: 1850, income: 62, color: '#48dbfb', hat: 'bow' },
  { name: 'Wild Boba', rarity: 'rare', price: 480, income: 16, color: '#feca57', hat: null },
  { name: 'Frosty Gummy', rarity: 'rare', price: 950, income: 32, color: '#dfe6e9', hat: null },
  { name: 'Ember Donut', rarity: 'rare', price: 1800, income: 60, color: '#5352ed', hat: null },
  { name: 'Ninja Wasabi', rarity: 'rare', price: 570, income: 19, color: '#f9ca24', hat: 'ears' },
  { name: 'Rusty Bat', rarity: 'rare', price: 590, income: 20, color: '#81ecec', hat: null },
  { name: 'Forest Raindrop', rarity: 'rare', price: 420, income: 14, color: '#636e72', hat: null },
  { name: 'Silver Cherry', rarity: 'rare', price: 970, income: 32, color: '#feca57', hat: 'bow' },
  { name: 'Dizzy Pizza', rarity: 'rare', price: 1100, income: 37, color: '#ff7f50', hat: 'sparkle' },
  { name: 'Hyper Eagle', rarity: 'rare', price: 1450, income: 48, color: '#ff9f43', hat: 'sparkle' },
  { name: 'Moonlit Carrot', rarity: 'rare', price: 580, income: 19, color: '#2ed573', hat: 'ears' },
  { name: 'Moonlit Octopus', rarity: 'rare', price: 440, income: 15, color: '#b2bec3', hat: null },
  { name: 'Shiny Monkey', rarity: 'rare', price: 520, income: 17, color: '#c56cf0', hat: null },
  { name: 'Jumbo Chick', rarity: 'rare', price: 790, income: 26, color: '#fab1a0', hat: null },
  { name: 'Zesty Eagle', rarity: 'rare', price: 740, income: 25, color: '#ff7f50', hat: null },
  { name: 'Glitter Mermaid', rarity: 'rare', price: 510, income: 17, color: '#00b894', hat: null },
  { name: 'Hyper Cherry', rarity: 'rare', price: 650, income: 22, color: '#f368e0', hat: null },
  { name: 'Royal Mango', rarity: 'rare', price: 1950, income: 65, color: '#ff4757', hat: 'sparkle' },
  { name: 'Ocean Cow', rarity: 'rare', price: 980, income: 33, color: '#00b894', hat: null },
  { name: 'Wild Cat', rarity: 'rare', price: 480, income: 16, color: '#2ed573', hat: 'ears' },
  { name: 'Cozy Zombie', rarity: 'rare', price: 610, income: 20, color: '#00cec9', hat: 'bow' },
  { name: 'Royal Dolphin', rarity: 'rare', price: 1250, income: 42, color: '#f9ca24', hat: null },
  { name: 'Shiny Duck', rarity: 'rare', price: 460, income: 15, color: '#70a1ff', hat: 'ears' },
  { name: 'Crispy Sunbeam', rarity: 'rare', price: 450, income: 15, color: '#00d2d3', hat: 'bow' },
  { name: 'Pirate Turtle', rarity: 'rare', price: 1700, income: 57, color: '#ff9f43', hat: 'bow' },
  { name: 'Grumpy Matcha', rarity: 'rare', price: 650, income: 22, color: '#ff6b6b', hat: null },
  { name: 'Shiny Zombie', rarity: 'rare', price: 1300, income: 43, color: '#feca57', hat: null },
  { name: 'Fierce Bear', rarity: 'rare', price: 850, income: 28, color: '#636e72', hat: 'bow' },
  { name: 'Bubble Seashell', rarity: 'rare', price: 480, income: 16, color: '#48dbfb', hat: 'sparkle' },
  { name: 'Zombie Bunny', rarity: 'rare', price: 520, income: 17, color: '#6c5ce7', hat: null },
  { name: 'Brave Zombie', rarity: 'rare', price: 1950, income: 65, color: '#55efc4', hat: 'bow' },
  { name: 'Cheesy Pickle', rarity: 'rare', price: 700, income: 23, color: '#5f27cd', hat: 'ears' },
  { name: 'Midnight Cookie', rarity: 'epic', price: 2850, income: 95, color: '#ffeaa7', hat: 'ears' },
  { name: 'Desert Rocket', rarity: 'epic', price: 7100, income: 237, color: '#fd79a8', hat: 'bow' },
  { name: 'Desert Burrito', rarity: 'epic', price: 3000, income: 100, color: '#6c5ce7', hat: null },
  { name: 'Royal Wolf', rarity: 'epic', price: 5800, income: 193, color: '#7b2ff7', hat: null },
  { name: 'Ocean Tiger', rarity: 'epic', price: 3600, income: 120, color: '#b2bec3', hat: 'ears' },
  { name: 'Arctic Skeleton', rarity: 'epic', price: 6650, income: 222, color: '#48dbfb', hat: null },
  { name: 'Peppy Bunny', rarity: 'epic', price: 6800, income: 227, color: '#1e90ff', hat: null },
  { name: 'Rainbow Wasabi', rarity: 'epic', price: 3950, income: 132, color: '#00cec9', hat: 'sparkle' },
  { name: 'Silver Waffle', rarity: 'epic', price: 2800, income: 93, color: '#e17055', hat: 'halo' },
  { name: 'Volcanic Gummy', rarity: 'epic', price: 2100, income: 70, color: '#ff7f50', hat: null },
  { name: 'Mega Eagle', rarity: 'epic', price: 4400, income: 147, color: '#5352ed', hat: 'ears' },
  { name: 'Jolly Moonbeam', rarity: 'epic', price: 2000, income: 67, color: '#00b894', hat: null },
  { name: 'Brave Knight', rarity: 'epic', price: 3350, income: 112, color: '#00cec9', hat: 'ears' },
  { name: 'Sunset Unicorn', rarity: 'epic', price: 4450, income: 148, color: '#5f27cd', hat: 'halo' },
  { name: 'Juicy Waffle', rarity: 'epic', price: 5700, income: 190, color: '#ffa502', hat: 'sparkle' },
  { name: 'Grumpy Banana', rarity: 'epic', price: 5100, income: 170, color: '#5352ed', hat: 'bow' },
  { name: 'Honey Monster', rarity: 'epic', price: 6100, income: 203, color: '#74b9ff', hat: null },
  { name: 'Thunder Muffin', rarity: 'epic', price: 5550, income: 185, color: '#636e72', hat: null },
  { name: 'Mini Cherry', rarity: 'epic', price: 5750, income: 192, color: '#5352ed', hat: 'halo' },
  { name: 'Glitter Koala', rarity: 'epic', price: 7800, income: 260, color: '#fdcb6e', hat: null },
  { name: 'Volcanic Fox', rarity: 'epic', price: 7550, income: 252, color: '#ffeaa7', hat: null },
  { name: 'Bubble Pumpkin', rarity: 'epic', price: 3400, income: 113, color: '#6c5ce7', hat: 'halo' },
  { name: 'Dizzy Cocoa', rarity: 'epic', price: 3600, income: 120, color: '#00b894', hat: 'ears' },
  { name: 'Super Melon', rarity: 'epic', price: 5100, income: 170, color: '#ff9f43', hat: 'bow' },
  { name: 'Shadow Pirate', rarity: 'epic', price: 4050, income: 135, color: '#c56cf0', hat: 'sparkle' },
  { name: 'Zombie Duck', rarity: 'epic', price: 4700, income: 157, color: '#70a1ff', hat: null },
  { name: 'Bouncy Snowman', rarity: 'epic', price: 5900, income: 197, color: '#f368e0', hat: null },
  { name: 'Bubble Peach', rarity: 'epic', price: 2550, income: 85, color: '#feca57', hat: 'halo' },
  { name: 'Cheesy Waffle', rarity: 'epic', price: 2850, income: 95, color: '#2e86de', hat: null },
  { name: 'Honey Monkey', rarity: 'epic', price: 5800, income: 193, color: '#e84393', hat: null },
  { name: 'Peppy Pumpkin', rarity: 'epic', price: 4100, income: 137, color: '#2e86de', hat: 'halo' },
  { name: 'Thunder Moonbeam', rarity: 'epic', price: 7350, income: 245, color: '#1e90ff', hat: null },
  { name: 'Gentle Unicorn', rarity: 'epic', price: 5050, income: 168, color: '#70a1ff', hat: 'halo' },
  { name: 'Electric Ghost', rarity: 'epic', price: 6200, income: 207, color: '#d63031', hat: 'bow' },
  { name: 'Wizard Firefly', rarity: 'epic', price: 2900, income: 97, color: '#ff4757', hat: null },
  { name: 'Cheesy Cupcake', rarity: 'epic', price: 6450, income: 215, color: '#feca57', hat: 'halo' },
  { name: 'Drowsy Skeleton', rarity: 'epic', price: 5350, income: 178, color: '#48dbfb', hat: null },
  { name: 'Pirate Snowflake', rarity: 'epic', price: 5450, income: 182, color: '#fdcb6e', hat: null },
  { name: 'Wobbly Bear', rarity: 'epic', price: 3300, income: 110, color: '#1e90ff', hat: 'sparkle' },
  { name: 'Golden Sloth', rarity: 'epic', price: 3750, income: 125, color: '#fdcb6e', hat: null },
  { name: 'Crystal Koala', rarity: 'epic', price: 7450, income: 248, color: '#f368e0', hat: 'sparkle' },
  { name: 'Arctic Firefly', rarity: 'epic', price: 6900, income: 230, color: '#2ed573', hat: null },
  { name: 'Electric Dolphin', rarity: 'epic', price: 4100, income: 137, color: '#7b2ff7', hat: 'sparkle' },
  { name: 'Magic Wolf', rarity: 'epic', price: 7500, income: 250, color: '#ffeaa7', hat: 'halo' },
  { name: 'Silver Ninja', rarity: 'epic', price: 5050, income: 168, color: '#ffd32a', hat: 'halo' },
  { name: 'Silver Bear', rarity: 'epic', price: 5250, income: 175, color: '#e84393', hat: 'sparkle' },
  { name: 'Turbo Seashell', rarity: 'epic', price: 2550, income: 85, color: '#48dbfb', hat: 'halo' },
  { name: 'Super Taco', rarity: 'epic', price: 2600, income: 87, color: '#70a1ff', hat: 'sparkle' },
  { name: 'Cozy Butterfly', rarity: 'epic', price: 2300, income: 77, color: '#00d2d3', hat: 'bow' },
  { name: 'Thunder Pizza', rarity: 'epic', price: 4950, income: 165, color: '#636e72', hat: 'halo' },
  { name: 'Spicy Cookie', rarity: 'epic', price: 2600, income: 87, color: '#636e72', hat: 'halo' },
  { name: 'Fluffy Burrito', rarity: 'epic', price: 3000, income: 100, color: '#0984e3', hat: null },
  { name: 'Arctic Eagle', rarity: 'epic', price: 3450, income: 115, color: '#b2bec3', hat: 'bow' },
  { name: 'Sleepy Sunbeam', rarity: 'epic', price: 6500, income: 217, color: '#e84393', hat: 'bow' },
  { name: 'Speedy Guac', rarity: 'epic', price: 7750, income: 258, color: '#eccc68', hat: null },
  { name: 'Sour Nacho', rarity: 'epic', price: 4700, income: 157, color: '#e17055', hat: null },
  { name: 'Mini Monster', rarity: 'epic', price: 2750, income: 92, color: '#c56cf0', hat: 'bow' },
  { name: 'Wobbly Starfish', rarity: 'epic', price: 7900, income: 263, color: '#6c5ce7', hat: 'ears' },
  { name: 'Fierce Toffee', rarity: 'epic', price: 5850, income: 195, color: '#7bed9f', hat: 'ears' },
  { name: 'Rainbow Noodle', rarity: 'epic', price: 5400, income: 180, color: '#6c5ce7', hat: null },
  { name: 'Alien Beaver', rarity: 'epic', price: 2650, income: 88, color: '#48dbfb', hat: null },
  { name: 'Forest Dolphin', rarity: 'epic', price: 5450, income: 182, color: '#feca57', hat: 'sparkle' },
  { name: 'Peppermint Sunbeam', rarity: 'epic', price: 7900, income: 263, color: '#c56cf0', hat: 'ears' },
  { name: 'Arctic Lollipop', rarity: 'epic', price: 4550, income: 152, color: '#fab1a0', hat: 'halo' },
  { name: 'Sunset Ramen', rarity: 'epic', price: 5200, income: 173, color: '#2e86de', hat: 'sparkle' },
  { name: 'Melty Ramen', rarity: 'epic', price: 5550, income: 185, color: '#0984e3', hat: 'bow' },
  { name: 'Royal Alpaca', rarity: 'epic', price: 7500, income: 250, color: '#fdcb6e', hat: null },
  { name: 'Starry Cat', rarity: 'epic', price: 3650, income: 122, color: '#ff9f43', hat: null },
  { name: 'Rusty Ninja', rarity: 'epic', price: 6600, income: 220, color: '#b2bec3', hat: 'bow' },
  { name: 'Crispy Raindrop', rarity: 'epic', price: 6600, income: 220, color: '#f368e0', hat: 'bow' },
  { name: 'Ultra Popcorn', rarity: 'epic', price: 3000, income: 100, color: '#ff5e8a', hat: null },
  { name: 'Fierce Butterfly', rarity: 'epic', price: 4950, income: 165, color: '#5f27cd', hat: 'ears' },
  { name: 'Hyper Jellyfish', rarity: 'epic', price: 3350, income: 112, color: '#ff7f50', hat: null },
  { name: 'Crispy Monster', rarity: 'epic', price: 4400, income: 147, color: '#ff6b6b', hat: 'ears' },
  { name: 'Peppermint Dolphin', rarity: 'epic', price: 2150, income: 72, color: '#eccc68', hat: 'halo' },
  { name: 'Zesty Snowflake', rarity: 'epic', price: 5750, income: 192, color: '#ffa502', hat: 'bow' },
  { name: 'Velvet Lollipop', rarity: 'epic', price: 4350, income: 145, color: '#2e86de', hat: null },
  { name: 'Frosty Shark', rarity: 'epic', price: 5300, income: 177, color: '#a29bfe', hat: null },
  { name: 'Wobbly Pepper', rarity: 'epic', price: 6750, income: 225, color: '#f9ca24', hat: 'halo' },
  { name: 'Fierce Gummy', rarity: 'epic', price: 3900, income: 130, color: '#3ee6c4', hat: 'ears' },
  { name: 'Pirate Wolf', rarity: 'epic', price: 6300, income: 210, color: '#48dbfb', hat: null },
  { name: 'Forest Tiger', rarity: 'epic', price: 3200, income: 107, color: '#eccc68', hat: 'ears' },
  { name: 'Moonlit Snowflake', rarity: 'epic', price: 2150, income: 72, color: '#48dbfb', hat: 'ears' },
  { name: 'Ember Ghost', rarity: 'epic', price: 4000, income: 133, color: '#d63031', hat: null },
  { name: 'Electric Llama', rarity: 'epic', price: 6300, income: 210, color: '#7b2ff7', hat: 'bow' },
  { name: 'Ember Guac', rarity: 'epic', price: 4100, income: 137, color: '#7bed9f', hat: 'halo' },
  { name: 'Pirate Seashell', rarity: 'epic', price: 4750, income: 158, color: '#00d2d3', hat: null },
  { name: 'Frosty Tiger', rarity: 'epic', price: 2100, income: 70, color: '#0984e3', hat: 'halo' },
  { name: 'Mega Pig', rarity: 'epic', price: 5700, income: 190, color: '#ff7675', hat: 'bow' },
  { name: 'Candy Cupcake', rarity: 'epic', price: 3200, income: 107, color: '#d63031', hat: null },
  { name: 'Cozy Fox', rarity: 'epic', price: 2850, income: 95, color: '#48dbfb', hat: 'bow' },
  { name: 'Crystal Panda', rarity: 'epic', price: 3300, income: 110, color: '#6c5ce7', hat: null },
  { name: 'Fluffy Crab', rarity: 'epic', price: 6350, income: 212, color: '#d63031', hat: 'halo' },
  { name: 'Groovy Starfish', rarity: 'epic', price: 2150, income: 72, color: '#7bed9f', hat: null },
  { name: 'Forest Zombie', rarity: 'epic', price: 5250, income: 175, color: '#00d2d3', hat: null },
  { name: 'Fluffy Cookie', rarity: 'epic', price: 3050, income: 102, color: '#a29bfe', hat: 'halo' },
  { name: 'Royal Seashell', rarity: 'epic', price: 7950, income: 265, color: '#00cec9', hat: 'halo' },
  { name: 'Silly Ramen', rarity: 'epic', price: 3050, income: 102, color: '#fd79a8', hat: 'ears' },
  { name: 'Fierce Popcorn', rarity: 'epic', price: 2400, income: 80, color: '#ffd32a', hat: null },
  { name: 'Midnight Duck', rarity: 'epic', price: 3600, income: 120, color: '#7bed9f', hat: 'bow' },
  { name: 'Silver Moonbeam', rarity: 'epic', price: 2600, income: 87, color: '#f9ca24', hat: 'bow' },
  { name: 'Bubbly Seashell', rarity: 'epic', price: 3100, income: 103, color: '#ff5e8a', hat: null },
  { name: 'Bouncy Ginger', rarity: 'epic', price: 4550, income: 152, color: '#b2bec3', hat: null },
  { name: 'Super Guac', rarity: 'epic', price: 4750, income: 158, color: '#d63031', hat: 'sparkle' },
  { name: 'Shiny Pudding', rarity: 'epic', price: 6750, income: 225, color: '#ff6b81', hat: null },
  { name: 'Midnight Snowman', rarity: 'epic', price: 3850, income: 128, color: '#00b894', hat: null },
  { name: 'Peppermint Ghost', rarity: 'epic', price: 7200, income: 240, color: '#f368e0', hat: 'bow' },
  { name: 'Wacky Apple', rarity: 'epic', price: 3500, income: 117, color: '#e84393', hat: 'ears' },
  { name: 'Golden Hotdog', rarity: 'epic', price: 3800, income: 127, color: '#7b2ff7', hat: null },
  { name: 'Salty Penguin', rarity: 'epic', price: 6000, income: 200, color: '#ffeaa7', hat: null },
  { name: 'Salty Sloth', rarity: 'epic', price: 5150, income: 172, color: '#ff7675', hat: 'bow' },
  { name: 'Ocean Robot', rarity: 'epic', price: 2750, income: 92, color: '#f368e0', hat: 'sparkle' },
  { name: 'Brave Firefly', rarity: 'epic', price: 5750, income: 192, color: '#48dbfb', hat: 'bow' },
  { name: 'Glitter Vampire', rarity: 'epic', price: 3550, income: 118, color: '#0984e3', hat: null },
  { name: 'Jumbo Taco', rarity: 'epic', price: 5300, income: 177, color: '#2ed573', hat: null },
  { name: 'Crispy Octopus', rarity: 'epic', price: 3450, income: 115, color: '#e17055', hat: 'bow' },
  { name: 'Electric Lemon', rarity: 'epic', price: 3350, income: 112, color: '#f9ca24', hat: null },
  { name: 'Cloudy Moonbeam', rarity: 'epic', price: 4700, income: 157, color: '#ff6b6b', hat: 'halo' },
  { name: 'Crystal Monkey', rarity: 'epic', price: 2850, income: 95, color: '#7b2ff7', hat: null },
  { name: 'Wobbly Toffee', rarity: 'epic', price: 3550, income: 118, color: '#70a1ff', hat: 'halo' },
  { name: 'Mini Lollipop', rarity: 'legendary', price: 16700, income: 557, color: '#0984e3', hat: 'sparkle' },
  { name: 'Neon Mermaid', rarity: 'legendary', price: 26100, income: 870, color: '#ff9f43', hat: 'halo' },
  { name: 'Sour Grape', rarity: 'legendary', price: 14100, income: 470, color: '#f368e0', hat: 'crown' },
  { name: 'Turbo Monster', rarity: 'legendary', price: 9950, income: 332, color: '#2e86de', hat: 'sparkle' },
  { name: 'Ultra Pig', rarity: 'legendary', price: 9500, income: 317, color: '#fdcb6e', hat: 'sparkle' },
  { name: 'Cosmic Zombie', rarity: 'legendary', price: 18300, income: 610, color: '#00cec9', hat: null },
  { name: 'Grumpy Spider', rarity: 'legendary', price: 29200, income: 973, color: '#ffd32a', hat: null },
  { name: 'Sunset Ninja', rarity: 'legendary', price: 17200, income: 573, color: '#e17055', hat: null },
  { name: 'Magic Sushi', rarity: 'legendary', price: 26200, income: 873, color: '#2ed573', hat: null },
  { name: 'Wild Snowflake', rarity: 'legendary', price: 24200, income: 807, color: '#5f27cd', hat: null },
  { name: 'Honey Pumpkin', rarity: 'legendary', price: 15600, income: 520, color: '#ff9f43', hat: 'sparkle' },
  { name: 'Candy Penguin', rarity: 'legendary', price: 18200, income: 607, color: '#e84393', hat: 'halo' },
  { name: 'Smiley Dolphin', rarity: 'legendary', price: 9550, income: 318, color: '#6c5ce7', hat: null },
  { name: 'Silly Knight', rarity: 'legendary', price: 19200, income: 640, color: '#00cec9', hat: 'crown' },
  { name: 'Stormy Snake', rarity: 'legendary', price: 17300, income: 577, color: '#ffa502', hat: 'sparkle' },
  { name: 'Sweet Bear', rarity: 'legendary', price: 17400, income: 580, color: '#ff6b6b', hat: 'sparkle' },
  { name: 'Drowsy Peach', rarity: 'legendary', price: 23000, income: 767, color: '#0984e3', hat: null },
  { name: 'Moonlit Sunbeam', rarity: 'legendary', price: 15600, income: 520, color: '#ff7675', hat: null },
  { name: 'Stormy Latte', rarity: 'legendary', price: 9850, income: 328, color: '#55efc4', hat: null },
  { name: 'Sunny Matcha', rarity: 'legendary', price: 9950, income: 332, color: '#5f27cd', hat: null },
  { name: 'Crystal Whale', rarity: 'legendary', price: 15600, income: 520, color: '#ffeaa7', hat: null },
  { name: 'Wizard Seashell', rarity: 'legendary', price: 10800, income: 360, color: '#1e90ff', hat: null },
  { name: 'Volcanic Melon', rarity: 'legendary', price: 12400, income: 413, color: '#7b2ff7', hat: 'crown' },
  { name: 'Tiny Popcorn', rarity: 'legendary', price: 21100, income: 703, color: '#81ecec', hat: null },
  { name: 'Ember Seashell', rarity: 'legendary', price: 14100, income: 470, color: '#ff9f43', hat: 'halo' },
  { name: 'Starry Fox', rarity: 'legendary', price: 16800, income: 560, color: '#1e90ff', hat: null },
  { name: 'Midnight Sunbeam', rarity: 'legendary', price: 26300, income: 877, color: '#1e90ff', hat: 'crown' },
  { name: 'Ocean Lemon', rarity: 'legendary', price: 24700, income: 823, color: '#f368e0', hat: 'halo' },
  { name: 'Drowsy Owl', rarity: 'legendary', price: 8750, income: 292, color: '#feca57', hat: 'crown' },
  { name: 'Mini Beaver', rarity: 'legendary', price: 14100, income: 470, color: '#1e90ff', hat: 'sparkle' },
  { name: 'Drowsy Rocket', rarity: 'legendary', price: 18800, income: 627, color: '#f9ca24', hat: 'sparkle' },
  { name: 'Rusty Chick', rarity: 'legendary', price: 17300, income: 577, color: '#55efc4', hat: 'halo' },
  { name: 'Peppermint Owl', rarity: 'legendary', price: 17000, income: 567, color: '#81ecec', hat: null },
  { name: 'Bouncy Moose', rarity: 'legendary', price: 16300, income: 543, color: '#ff7675', hat: null },
  { name: 'Rusty Wasabi', rarity: 'legendary', price: 20500, income: 683, color: '#feca57', hat: 'halo' },
  { name: 'Pirate Burger', rarity: 'legendary', price: 24200, income: 807, color: '#70a1ff', hat: null },
  { name: 'Zombie Popcorn', rarity: 'legendary', price: 22200, income: 740, color: '#ff9f43', hat: 'crown' },
  { name: 'Chill Nacho', rarity: 'legendary', price: 28000, income: 933, color: '#ffa502', hat: 'crown' },
  { name: 'Shiny Butterfly', rarity: 'legendary', price: 19500, income: 650, color: '#3ee6c4', hat: 'halo' },
  { name: 'Super Brownie', rarity: 'legendary', price: 28400, income: 947, color: '#d63031', hat: null },
  { name: 'Juicy Sloth', rarity: 'legendary', price: 11700, income: 390, color: '#ff6b6b', hat: null },
  { name: 'Magic Ginger', rarity: 'legendary', price: 10100, income: 337, color: '#ff6b6b', hat: 'crown' },
  { name: 'Forest Pirate', rarity: 'legendary', price: 8750, income: 292, color: '#ff4757', hat: null },
  { name: 'Sweet Shark', rarity: 'legendary', price: 19200, income: 640, color: '#f368e0', hat: 'halo' },
  { name: 'Bubbly Llama', rarity: 'legendary', price: 12300, income: 410, color: '#ff5e8a', hat: 'crown' },
  { name: 'Desert Lion', rarity: 'legendary', price: 8050, income: 268, color: '#1dd1a1', hat: 'halo' },
  { name: 'Sunset Pickle', rarity: 'legendary', price: 10600, income: 353, color: '#1dd1a1', hat: 'crown' },
  { name: 'Super Jelly', rarity: 'legendary', price: 10600, income: 353, color: '#7bed9f', hat: 'halo' },
  { name: 'Tiny Gummy', rarity: 'legendary', price: 10700, income: 357, color: '#d63031', hat: 'halo' },
  { name: 'Groovy Firefly', rarity: 'legendary', price: 21600, income: 720, color: '#55efc4', hat: 'halo' },
  { name: 'Bubbly Pig', rarity: 'legendary', price: 15600, income: 520, color: '#fd79a8', hat: null },
  { name: 'Sour Corn', rarity: 'legendary', price: 15100, income: 503, color: '#00d2d3', hat: 'halo' },
  { name: 'Turbo Cherry', rarity: 'legendary', price: 14900, income: 497, color: '#00b894', hat: 'sparkle' },
  { name: 'Volcanic Sloth', rarity: 'legendary', price: 21000, income: 700, color: '#ff7f50', hat: 'sparkle' },
  { name: 'Tiny Broccoli', rarity: 'legendary', price: 23400, income: 780, color: '#ff7675', hat: 'halo' },
  { name: 'Ocean Dolphin', rarity: 'legendary', price: 13600, income: 453, color: '#d63031', hat: 'crown' },
  { name: 'Turbo Pudding', rarity: 'legendary', price: 16300, income: 543, color: '#d63031', hat: null },
  { name: 'Bubble Latte', rarity: 'legendary', price: 28100, income: 937, color: '#55efc4', hat: null },
  { name: 'Lucky Snake', rarity: 'legendary', price: 19100, income: 637, color: '#636e72', hat: null },
  { name: 'Sweet Crab', rarity: 'legendary', price: 27200, income: 907, color: '#5352ed', hat: 'crown' },
  { name: 'Fierce Wizard', rarity: 'mythic', price: 34800, income: 1160, color: '#81ecec', hat: 'halo' },
  { name: 'Zombie Pretzel', rarity: 'mythic', price: 82600, income: 2753, color: '#e84393', hat: null },
  { name: 'Midnight Eagle', rarity: 'mythic', price: 52800, income: 1760, color: '#fdcb6e', hat: 'sparkle' },
  { name: 'Cozy Cocoa', rarity: 'mythic', price: 34700, income: 1157, color: '#ff9ff3', hat: 'crown' },
  { name: 'Ocean Banana', rarity: 'mythic', price: 112000, income: 3733, color: '#0984e3', hat: 'crown' },
  { name: 'Smiley Bear', rarity: 'mythic', price: 35000, income: 1167, color: '#5352ed', hat: 'sparkle' },
  { name: 'Stormy Muffin', rarity: 'mythic', price: 69700, income: 2323, color: '#ff9f43', hat: 'halo' },
  { name: 'Sneaky Horse', rarity: 'mythic', price: 47900, income: 1597, color: '#ff6b81', hat: 'sparkle' },
  { name: 'Honey Gummy', rarity: 'mythic', price: 172000, income: 5733, color: '#ff9f43', hat: 'halo' },
  { name: 'Mini Vampire', rarity: 'mythic', price: 77700, income: 2590, color: '#f9ca24', hat: 'crown' },
  { name: 'Salty Wasabi', rarity: 'mythic', price: 122000, income: 4067, color: '#d63031', hat: 'halo' },
  { name: 'Velvet Peach', rarity: 'mythic', price: 272000, income: 9067, color: '#fdcb6e', hat: 'sparkle' },
  { name: 'Silly Popcorn', rarity: 'mythic', price: 35600, income: 1187, color: '#fd79a8', hat: 'halo' },
  { name: 'Glitter Apple', rarity: 'mythic', price: 46900, income: 1563, color: '#b2bec3', hat: 'halo' },
  { name: 'Cloudy Starfish', rarity: 'mythic', price: 177000, income: 5900, color: '#00b894', hat: 'crown' },
  { name: 'Zombie Corn', rarity: 'mythic', price: 78000, income: 2600, color: '#ff5e8a', hat: 'crown' },
  { name: 'Happy Wolf', rarity: 'mythic', price: 126000, income: 4200, color: '#6c5ce7', hat: 'crown' },
  { name: 'Electric Cocoa', rarity: 'mythic', price: 79000, income: 2633, color: '#c56cf0', hat: null },
  { name: 'Giant Carrot', rarity: 'mythic', price: 96700, income: 3223, color: '#ff7675', hat: null },
  { name: 'Frosty Guac', rarity: 'mythic', price: 87200, income: 2907, color: '#ff6b6b', hat: 'halo' },
  { name: 'Ultra Octopus', rarity: 'mythic', price: 62400, income: 2080, color: '#636e72', hat: 'crown' },
];
const RARITY_COLOR = { common: 0x9aa5b1, rare: 0x4a90e2, epic: 0x9b59e6, legendary: 0xf5b301, mythic: 0xff5e8a, secret: 0x9d4edd };
// One-of-one blob for @scout: a black void blob. Reserved id 90001 is far beyond
// the conveyor's sequential ids, so spawnBlob() is deterministic for it on every
// client and the grant below stays in sync across the room.
const SCOUT_BLOB_ID = 90001;
const SCOUT_BLOB_NAME = 'Scout Blob';

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0; return h; }
function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pickBlob(rnd) {
  const total = 100;
  let roll = rnd() * total, rarity = 'common';
  for (const [k, w] of Object.entries(RARITY_W)) { roll -= w; if (roll <= 0) { rarity = k; break; } }
  const pool = SAB_BLOBS.filter(b => b.rarity === rarity);
  return pool[Math.floor(rnd() * pool.length)];
}

// --- graphics helpers (canvas textures, shared) ---
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function makeGlowTexture(hex) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const gr = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, hex); gr.addColorStop(0.4, hex + 'aa'); gr.addColorStop(1, hex + '00');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
  const tx = new THREE.CanvasTexture(cv); return tx;
}
function makeStarTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(32, 2); ctx.quadraticCurveTo(38, 26, 62, 32); ctx.quadraticCurveTo(38, 38, 32, 62);
  ctx.quadraticCurveTo(26, 38, 2, 32); ctx.quadraticCurveTo(26, 26, 32, 2); ctx.fill();
  return new THREE.CanvasTexture(cv);
}
const STAR_TEX = () => (makeStarTexture._t || (makeStarTexture._t = makeStarTexture()));

function shade(hex, f) {
  const c = new THREE.Color(hex); c.multiplyScalar(f); return c;
}

function buildBlobMesh(b) {
  const g = new THREE.Group();
  const refs = {};
  // glossy jelly body
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: b.color, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.12 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 28, 20), bodyMat);
  body.scale.y = 0.85; body.position.y = 1.3; body.castShadow = true;
  g.add(body); refs.body = body; refs.bodyMat = bodyMat;
  // cartoon gloss shine (upper-left of the face)
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
  shine.scale.set(1, 1.5, 0.3); shine.position.set(-0.55, 1.95, 1.05); g.add(shine);
  // expressive eyes: white + pupil + highlight, grouped for blinking
  refs.eyes = [];
  for (const sx of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sx * 0.52, 1.68, 1.02);
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    white.scale.z = 0.55; eg.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 }));
    pupil.position.set(0, 0, 0.2); eg.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(0.07, 0.08, 0.34); eg.add(glint);
    g.add(eg); refs.eyes.push(eg);
  }
  // blush cheeks
  for (const sx of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16),
      new THREE.MeshBasicMaterial({ color: 0xff8fab, transparent: true, opacity: 0.55, depthWrite: false }));
    ch.position.set(sx * 0.98, 1.28, 1.02); g.add(ch);
  }
  // mouth: open smile for the soft blobs, classic smile otherwise
  if (b.name === 'Gooey' || b.name === 'Pudding') {
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x5b2233, roughness: 0.6 }));
    mouth.rotation.z = Math.PI; mouth.position.set(0, 1.28, 1.16); g.add(mouth);
  } else {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 6, 14, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    smile.rotation.z = Math.PI; smile.position.set(0, 1.3, 1.15); g.add(smile);
  }
  // waddly feet + little arms (darker shade of the body)
  const dark = shade(b.color, 0.75);
  refs.feet = []; refs.arms = [];
  for (const sx of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshStandardMaterial({ color: dark, roughness: 0.3 }));
    f.scale.set(1, 0.55, 1.25); f.position.set(sx * 0.55, 0.24, 0.35); f.castShadow = true; g.add(f); refs.feet.push(f);
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshStandardMaterial({ color: dark, roughness: 0.3 }));
    a.scale.set(0.7, 1.2, 0.7); a.position.set(sx * 1.28, 1.1, 0.15); g.add(a); refs.arms.push(a);
  }
  // hats, upgraded
  if (b.hat === 'crown') {
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.25 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.68, 0.55, 8), gold);
    c.position.y = 2.55; g.add(c);
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 4), gold);
      const ang = (i / 3) * Math.PI * 2;
      spike.position.set(Math.cos(ang) * 0.5, 2.95, Math.sin(ang) * 0.5); g.add(spike);
    }
    for (const sx of [-1, 1]) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: 0xff2d55, emissive: 0xff2d55, emissiveIntensity: 0.7 }));
      gem.position.set(sx * 0.45, 2.55, 0.55); g.add(gem);
    }
  } else if (b.hat === 'bow') {
    const pink = new THREE.MeshStandardMaterial({ color: 0xff5e8a, roughness: 0.4 });
    for (const sx of [-1, 1]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.13, 8, 16), pink);
      loop.position.set(sx * 0.35, 2.45, 0.55); loop.rotation.z = sx * 0.5; g.add(loop);
    }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), pink);
    knot.position.set(0, 2.45, 0.6); g.add(knot);
  } else if (b.hat === 'ears') {
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.0, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
      e.position.set(sx * 0.7, 2.45, 0); e.rotation.z = sx * -0.15; g.add(e);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 8), new THREE.MeshStandardMaterial({ color: 0xffb3c8, roughness: 0.5 }));
      inner.position.set(sx * 0.7, 2.4, 0.2); inner.rotation.z = sx * -0.15; g.add(inner);
    }
  } else if (b.hat === 'halo') {
    const hg = new THREE.Group(); hg.position.y = 2.75;
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 28), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.2 }));
    h.rotation.x = Math.PI / 2; hg.add(h);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('#ffd700'), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(2.2); hg.add(glow);
    g.add(hg); refs.halo = hg;
  } else if (b.hat === 'sparkle') {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.38), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3ee6c4, emissiveIntensity: 1.4 }));
    s.position.y = 2.65; g.add(s); refs.spinHat = s;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('#3ee6c4'), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(2.0); glow.position.y = 2.65; g.add(glow);
  } else if (b.hat === 'scout') {
    // campaign hat: wide flat brim + domed crown, void-purple band
    const green = new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.55 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 20), green);
    brim.position.y = 2.42; g.add(brim);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), green);
    crown.scale.y = 0.9; crown.position.y = 2.44; g.add(crown);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 8, 20), new THREE.MeshStandardMaterial({ color: 0x9d4edd, roughness: 0.5, emissive: 0x9d4edd, emissiveIntensity: 0.4 }));
    band.rotation.x = Math.PI / 2; band.position.y = 2.5; g.add(band);
  }
  // rarity ring + soft ground glow (pulses in tick)
  const rc = RARITY_COLOR[b.rarity];
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.07, 8, 40), new THREE.MeshStandardMaterial({ color: rc, emissive: rc, emissiveIntensity: 0.8 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring); refs.ring = ring;
  const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24),
    new THREE.MeshBasicMaterial({ map: makeGlowTexture('#' + rc.toString(16).padStart(6, '0')), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  glowDisc.rotation.x = -Math.PI / 2; glowDisc.position.y = 0.06; g.add(glowDisc); refs.glowDisc = glowDisc;
  // orbiting sparkles for epic and up
  if (b.rarity === 'epic' || b.rarity === 'legendary' || b.rarity === 'mythic' || b.rarity === 'secret') {
    const sg = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR_TEX(), color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      const ang = (i / 4) * Math.PI * 2;
      sp.position.set(Math.cos(ang) * 1.9, 1.2 + (i % 2) * 0.9, Math.sin(ang) * 1.9);
      sp.scale.setScalar(0.35); sg.add(sp);
    }
    g.add(sg); refs.sparkles = sg;
  }
  // void aura for secret-rarity blobs (the Scout Blob's black-void glow)
  if (b.rarity === 'secret') {
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('#9d4edd'), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    aura.scale.setScalar(4.2); aura.position.y = 1.35; g.add(aura); refs.aura = aura;
  }
  // floating name + price/income label
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160;
  const tex = new THREE.CanvasTexture(cv);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  label.scale.set(4.6, 1.44, 1); label.position.y = 3.9; g.add(label);
  refs.labelCv = cv; refs.labelTex = tex;
  g.userData.refs = refs;
  drawLabel(b, refs);
  return g;
}

function drawLabel(b, refs) {
  refs = refs || b.mesh.userData.refs;
  const cv = refs.labelCv, ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 160);
  const rc = '#' + RARITY_COLOR[b.rarity].toString(16).padStart(6, '0');
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; roundRect(ctx, 8, 8, 496, 144, 28); ctx.fill();
  ctx.strokeStyle = rc; ctx.lineWidth = 6; roundRect(ctx, 8, 8, 496, 144, 28); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px sans-serif';
  ctx.fillText(b.name, 256, 66);
  if (b.state === 'walking') {
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText('🪙 ' + b.price.toLocaleString(), 256, 128);
  } else {
    ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText('💰 ' + b.income + '/s', 256, 128);
  }
  refs.labelTex.needsUpdate = true;
}

export function startStealABlob(game) {
  // Spawn salt rotates every UTC day: the seed used to be only the gameId,
  // so the same game opened with the exact same blobs in the exact same
  // order every single session — a visible pattern. All clients share the
  // UTC date, so they still agree on every spawn; a session straddling
  // midnight UTC may briefly disagree on new spawns, and the buy/sell
  // relay heals that. Saved blobs store their own type (see saveProgress),
  // so the rotation never changes a blob you already own.
  const seed = hashStr(String(game.o.gameId || 'stealablob') + '|' + new Date().toISOString().slice(0, 10));
  // The pre-rotation seed (gameId only): rebuilds blobs from old v1 saves,
  // which stored an id but not the blob itself.
  const legacySeed = hashStr(String(game.o.gameId || 'stealablob'));
  const blobs = new Map(); // spawnIdx -> blob
  const steals = new Map(); // playerId -> { blobId, endsAt }
  let coins = 150, spawnIdx = 0, lastSpawn = 0, lastSlap = 0;
  let rebirths = 0, sellMode = false;
  let mySteal = null; // { blobId, endsAt }

  // HUD
  const hud = document.createElement('div');
  hud.className = 'sab-hud';
  hud.innerHTML = `<span class="sab-pill">🪙 <b class="sab-coins">150</b></span><span class="sab-pill">💰 <b class="sab-inc">0</b>/s</span><span class="sab-pill">🫧 <b class="sab-owned">0</b></span><span class="sab-pill">🏠 <b class="sab-base">…</b></span><span class="sab-pill">📖 <b>${SAB_BLOBS.length.toLocaleString()}</b> blobs</span><span class="sab-hint">Click a walking blob to buy · enemy blob to steal · Sell mode: click your blob to sell</span>`;
  const style = document.createElement('style');
  style.textContent = `.sab-hud{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:5;flex-wrap:wrap;justify-content:center}.sab-pill{background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.2);padding:6px 12px;border-radius:999px;font-size:14px;font-weight:700}.sab-hint{font-size:12px;color:#cfd8e3;align-self:center}.sab-btn{cursor:pointer;color:#fff;font-family:inherit}.sab-panel{position:absolute;top:64px;left:50%;transform:translateX(-50%);z-index:6;background:rgba(10,10,20,.94);border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:12px 14px;flex-direction:column;gap:8px;min-width:290px;color:#fff;font-size:14px}.sab-prow{display:flex;gap:8px;align-items:center;justify-content:space-between}.sab-buy{background:#7c3aed;color:#fff;border:0;border-radius:999px;padding:6px 12px;font-weight:700;cursor:pointer;font-family:inherit}.sab-owned{color:#3ee6c4;font-weight:700}`;
  game.c.appendChild(style); game.c.appendChild(hud);
  const coinsEl = hud.querySelector('.sab-coins'), incEl = hud.querySelector('.sab-inc'), ownedEl = hud.querySelector('.sab-owned'), baseEl = hud.querySelector('.sab-base');

  // action buttons: sell-mode toggle, rebirth, game-passes shop
  function hudBtn(cls, label) { const b = document.createElement('button'); b.className = 'sab-pill sab-btn ' + cls; b.textContent = label; hud.appendChild(b); return b; }
  const sellBtn = hudBtn('sab-sell', '💰 Sell: OFF');
  const sellAllBtn = hudBtn('sab-sellall', '💰 Sell all');
  const rebBtn = hudBtn('sab-reb', '♻️ Rebirth');
  const passBtn = hudBtn('sab-pass', '🎟️ Passes');
  let rebArmAt = 0;
  sellBtn.onclick = () => {
    sellMode = !sellMode;
    sellBtn.textContent = sellMode ? '💰 Sell: ON' : '💰 Sell: OFF';
    sellBtn.style.background = sellMode ? '#b8860b' : '';
    game.sys(sellMode ? '💰 Sell mode ON — click one of YOUR blobs to sell it for half price' : '💰 Sell mode off');
  };
  sellAllBtn.onclick = () => {
    const mine = [...blobs.values()].filter(b => b.state === 'owned' && b.owner === game.myId);
    if (!mine.length) { game.sys('💰 You have no blobs to sell'); return; }
    for (const b of mine) doSell(b);
  };
  rebBtn.onclick = () => {
    const now = Date.now();
    if (now - rebArmAt < 4000) { rebArmAt = 0; doRebirth(); return; }
    rebArmAt = now;
    rebBtn.textContent = '⚠️ Tap again!';
    game.sys(`♻️ Tap Rebirth again to confirm: you lose your coins + blobs, but your income becomes ×${multFor(rebirths + 1)} FOREVER (cost ${rebirthCost().toLocaleString()} coins)`);
    setTimeout(() => { if (Date.now() - rebArmAt >= 4000) refreshHud(); }, 4100);
  };
  // game-passes panel (passes are catalog items, bought with FunTix)
  const panel = document.createElement('div');
  panel.className = 'sab-panel'; panel.style.display = 'none';
  game.c.appendChild(panel);
  function renderPasses() {
    panel.innerHTML = '';
    const head = document.createElement('div');
    head.innerHTML = `🎟️ <b>Game Passes</b> · you have <b>${(game.me?.funtix ?? 0).toLocaleString()}</b> FunTix`;
    panel.appendChild(head);
    for (const p of PASSES) {
      const row = document.createElement('div'); row.className = 'sab-prow';
      const txt = document.createElement('span');
      txt.innerHTML = `${p.emoji} <b>${p.name}</b><br><span style="color:#cfd8e3;font-size:12px">${p.desc}</span>`;
      row.appendChild(txt);
      if (hasPass(p.id)) {
        const o = document.createElement('span'); o.className = 'sab-owned'; o.textContent = '✓ Owned'; row.appendChild(o);
      } else {
        const b = document.createElement('button'); b.className = 'sab-buy'; b.textContent = p.price + ' FunTix'; b.onclick = () => buyPass(p); row.appendChild(b);
      }
      panel.appendChild(row);
    }
  }
  async function buyPass(p) {
    if (hasPass(p.id)) return;
    try {
      const r = await fetch('/api/buy/' + p.id, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + game.o.token } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { game.sys('❌ ' + (d.error || 'Could not buy that pass')); return; }
      if (game.me) { game.me.funtix = d.funtix; game.me.inventory = d.inventory; }
      if (typeof game.setMoney === 'function') game.setMoney({ funtix: d.funtix });
      game.sys(`🎟️ You bought ${p.name}!`);
      renderPasses(); refreshHud();
    } catch (e) { game.sys('❌ Could not reach the shop'); }
  }
  passBtn.onclick = () => {
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'flex' : 'none';
    if (open) renderPasses();
  };

  // one-shot particle bursts (buy / steal celebrations)
  const bursts = [];
  function burst(x, y, z, color) {
    const grp = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR_TEX(), color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.setScalar(0.35 + Math.random() * 0.35);
      s.position.set(x, y, z);
      s.userData.v = new THREE.Vector3((Math.random() - 0.5) * 9, 4 + Math.random() * 5, (Math.random() - 0.5) * 9);
      grp.add(s);
    }
    game.scene.add(grp);
    bursts.push({ grp, t0: Date.now() });
  }
  function tickBursts(dt) {
    const t = Date.now();
    for (const br of [...bursts]) {
      const age = (t - br.t0) / 1000;
      if (age > 0.8) { game.scene.remove(br.grp); bursts.splice(bursts.indexOf(br), 1); continue; }
      for (const s of br.grp.children) {
        s.position.x += s.userData.v.x * dt; s.position.y += s.userData.v.y * dt; s.position.z += s.userData.v.z * dt;
        s.userData.v.y -= 14 * dt;
        s.material.opacity = 1 - age / 0.8;
      }
    }
  }

  // --- base assignment: deterministic, identical on every client ---
  // The old code gave every client base 0 for itself: myBase()/baseFor()
  // handed out the first free slot in *local arrival order*, and each client
  // claimed its own base on its first tick — before it had seen anyone
  // else's blob events — so every player landed on Base 1 (blue) on their
  // own screen, and clients disagreed about everyone else's base too.
  // Server pids are assigned sequentially at join (server.js nextPid++), so
  // pid order IS room join order, shared by every client. A player's base is
  // their rank among the players currently in the room (myId + game.players,
  // sorted by pid) — every client computes the same ranks from the same
  // server-broadcast player list, so everyone agrees on everyone's base.
  // Tradeoff: if a player leaves mid-game, the players after them shuffle
  // down one base (their blobs slide over with them). Blobs owned by a
  // player who left keep the base they were last seen in (frozenBases).
  // More than 8 players wrap (rank % 8): the map only has 8 bases.
  const frozenBases = new Map(); // pid -> baseIdx, for players who left
  let lastPidKey = '', lastRanks = new Map();
  function currentPids() {
    const s = new Set(game.players.keys());
    if (game.myId != null) s.add(game.myId);
    return [...s].sort((a, b) => a - b);
  }
  function baseFor(pid) {
    if (pid == null) return 0;
    const ranked = currentPids();
    const rank = ranked.indexOf(pid);
    if (rank >= 0) return rank % SAB_BASES.length;
    if (frozenBases.has(pid)) return frozenBases.get(pid);
    return 0;
  }
  function myBase() { return game.myId == null ? 0 : baseFor(game.myId); }
  // Remember the base of anyone who leaves, so their orphan blobs don't
  // jump to base 0. Runs from tick; only does work when the player set changes.
  function noteLeavers() {
    const ranked = currentPids();
    const key = ranked.join(',');
    if (key === lastPidKey) return;
    const now = new Map(ranked.map((pid, i) => [pid, i % SAB_BASES.length]));
    for (const [pid, b] of lastRanks) if (!now.has(pid)) frozenBases.set(pid, b);
    lastRanks = now; lastPidKey = key;
  }
  function freeSlot(baseIdx) {
    for (let s = 0; s < SAB_SLOTS; s++) {
      const taken = [...blobs.values()].some(b => b.base === baseIdx && b.slot === s && (b.state === 'owned' || b.state === 'returning'));
      if (!taken) return s;
    }
    return -1;
  }
  // "YOUR BASE" beacon: the game never told the player which base is theirs
  // (they spawn at SpawnLocation, away from all bases), so mark it clearly.
  let baseMarker = null;
  function makeBaseMarker(quiet) {
    const idx = myBase();
    const bp = SAB_BASES[idx], bc = SAB_BASE_COLORS[idx];
    const grp = new THREE.Group();
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.font = '900 64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText('⭐ YOUR BASE', 256, 64);
    ctx.fillStyle = '#ffd700'; ctx.fillText('⭐ YOUR BASE', 256, 64);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
    label.scale.set(11, 2.75, 1); label.position.y = 8; label.renderOrder = 999;
    grp.add(label);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.18, 8, 48), ringMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.75;
    grp.add(ring);
    grp.position.set(bp.x, 0, bp.z);
    game.scene.add(grp);
    baseMarker = { grp, ringMat, idx };
    baseEl.textContent = `Base ${idx + 1} (${bc.name})`;
    if (!quiet) game.sys(`⭐ Your base is Base ${idx + 1} (${bc.name}) — follow the gold marker!`);
  }
  // --- game passes + rebirths ---
  // Passes are catalog items (type 'pass') bought with FunTix via POST
  // /api/buy/:item; ownership lives in the account inventory (server-side),
  // so passes work on any device. Effects are read live from game.me.
  const PASSES = [
    { id: 'pass_income2x', emoji: '💰', name: '2x Blob Income', desc: 'Your blobs earn double coins, forever.', price: 500 },
    { id: 'pass_faststeal', emoji: '⚡', name: 'Fast Steal', desc: 'Steal enemy blobs in 1.5s instead of 3s.', price: 250 },
    { id: 'pass_bigstart', emoji: '🪙', name: 'Big Start', desc: '+500 starting Blob Coins every join.', price: 200 },
    { id: 'pass_income3x', emoji: '💎', name: '3x Blob Income', desc: 'Your blobs earn triple coins, forever. Stacks with the 2x pass!', price: 1000 },
    { id: 'pass_megastart', emoji: '🏦', name: 'Mega Start', desc: '+1,500 starting Blob Coins every join. Stacks with Big Start!', price: 400 },
  ];
  function hasPass(id) { return !!(game.me && Array.isArray(game.me.inventory) && game.me.inventory.includes(id)); }
  function startCoins() { return 150 + (hasPass('pass_bigstart') ? 500 : 0) + (hasPass('pass_megastart') ? 1500 : 0); }
  function multFor(r) { return (1 + r) * (hasPass('pass_income2x') ? 2 : 1) * (hasPass('pass_income3x') ? 3 : 1); }
  function incomeMult() { return multFor(rebirths); }
  function rebirthCost() { return 2500 * (rebirths + 1) * (rebirths + 1); }

  // Progress autosave (localStorage, per game + player): Blob Coins and owned
  // blobs survive leaving and rejoining on the same device/browser. Server
  // persistence isn't an option without a new endpoint (server.js is at its
  // push size cap), and Blob Coins are client-side by design.
  // KEYED BY USERNAME, not session id: game.myId is a per-connection counter
  // (server nextPid++ on every join), so it changes on every rejoin and a
  // myId-keyed save would never restore. Usernames are stable.
  function saveName() { return (game.me && game.me.name) || game.myId; }
  function saveKey() { return 'sab-save:' + String(game.o.gameId || 'stealablob') + ':' + String(saveName()); }
  function saveProgress() {
    if (game.myId == null || !restoredSave) return; // never save before restore: the start-time HUD refresh would wipe last session's save
    try {
      const owned = [...blobs.values()]
        .filter(b => b.owner === game.myId && (b.state === 'owned' || b.state === 'returning'))
        // store the blob itself, not just its id: the spawn pool rotates
        // daily now, so an id alone would restore a different blob tomorrow
        .map(b => ({ id: b.id, base: b.base, slot: b.slot, def: { name: b.name, rarity: b.rarity, price: b.price, income: b.income, color: b.color, hat: b.hat || null, noSteal: !!b.noSteal } }));
      localStorage.setItem(saveKey(), JSON.stringify({ v: 2, gameId: game.o.gameId || 'stealablob', name: saveName(), coins: Math.floor(coins), rebirths, scoutGranted, owned }));
    } catch (e) { /* storage unavailable (private mode): progress just won't persist */ }
  }
  let restoredSave = false;
  function restoreSave() {
    if (restoredSave || game.myId == null) return;
    restoredSave = true;
    let s = null;
    try { s = JSON.parse(localStorage.getItem(saveKey()) || 'null'); } catch (e) { return; }
    if (!s || (s.v !== 1 && s.v !== 2) || s.gameId !== (game.o.gameId || 'stealablob') || s.name !== saveName()) return;
    if (Number.isFinite(s.coins) && s.coins >= 0) coins = Math.floor(s.coins);
    if (Number.isFinite(s.rebirths) && s.rebirths >= 0) rebirths = Math.min(100, Math.floor(s.rebirths));
    if (s.scoutGranted) scoutGranted = true;
    const entries = Array.isArray(s.owned) ? s.owned : [];
    let placed = 0;
    // Restored blobs go into your CURRENT base (rank among the players in
    // the room right now), not the base saved last session — the saved base
    // belonged to a different room line-up, and restoring into it put your
    // blobs in another player's base on everyone else's screen.
    const base = myBase();
    for (const e of entries) {
      if (!Number.isInteger(e.id) || e.id < 0) continue;
      if (blobs.has(e.id) && blobs.get(e.id).owner === game.myId) continue; // already mine
      let slot = (Number.isInteger(e.slot) && e.slot >= 0 && e.slot < SAB_SLOTS) ? e.slot : -1;
      if (slot < 0 || [...blobs.values()].some(b => b.base === base && b.slot === slot && (b.state === 'owned' || b.state === 'returning'))) {
        slot = freeSlot(base);
        if (slot < 0) continue; // base full: blob stays lost rather than stacking
      }
      let b = blobs.get(e.id);
      if (!b) {
        if (e.def && typeof e.def.name === 'string' && e.def.name.length <= 18 && RARITY_W[e.def.rarity] !== undefined) {
          // v2 save: rebuild this exact blob, not a random one
          spawnBlob(e.id, undefined, e.def);
        } else {
          // v1 save: no blob stored — rebuild with the old gameId-only seed
          spawnBlob(e.id, legacySeed);
        }
        b = blobs.get(e.id);
      }
      if (!b) continue;
      // a walking blob of the same id: take it over (no duplicate)
      b.state = 'owned'; b.owner = game.myId; b.base = base; b.slot = slot;
      const p = sabSlotPos(base, slot);
      b.x = p.x; b.z = p.z; b.surfY = 0.72;
      drawLabel(b);
      sendBlob('buy', b.id);
      placed++;
    }
    refreshHud();
    if (placed > 0 || coins !== startCoins()) game.sys(`💾 Progress restored: ${placed} blob${placed === 1 ? '' : 's'}, ${Math.floor(coins)} coins`);
  }
  // One-time gift: when @scout joins Steal a Blob, a black void Scout Blob is
  // placed in their base. Granted once per save (scoutGranted flag) so it can't
  // be farmed by selling + rejoining; it's unstealable (noSteal) so the
  // one-of-one can't be taken. Selling / rebirth still remove it, by choice.
  let scoutGranted = false;
  let scoutGrantChecked = false;
  function grantScoutBlob() {
    if (String(saveName()).toLowerCase() !== 'scout') return;
    if (scoutGranted) return;
    if ([...blobs.values()].some(b => b.name === SCOUT_BLOB_NAME && b.owner === game.myId)) { scoutGranted = true; saveProgress(); return; }
    const base = myBase();
    const slot = freeSlot(base);
    if (slot < 0) return; // base full: try again next join (flag stays unset)
    spawnBlob(SCOUT_BLOB_ID);
    const b = blobs.get(SCOUT_BLOB_ID);
    if (!b) return;
    b.state = 'owned'; b.owner = game.myId; b.base = base; b.slot = slot;
    const p = sabSlotPos(base, slot);
    b.x = p.x; b.z = p.z; b.surfY = 0.72;
    drawLabel(b);
    burst(b.x, 1.5, b.z, 0x9d4edd);
    sendBlob('buy', b.id);
    scoutGranted = true;
    saveProgress(); refreshHud();
    game.sys('🖤 A special Scout Blob — a black void blob made just for @scout — joined your base! It can never be stolen.');
  }
  function spawnBlob(idx, seedOverride, defOverride) {
    if (blobs.has(idx)) return; // never double-spawn (restore pre-creates ids)
    const rnd = mulberry((seedOverride ?? seed) + idx * 7919);
    const t = defOverride || (idx === SCOUT_BLOB_ID ? SAB_BLOBS.find(b => b.name === SCOUT_BLOB_NAME) : pickBlob(rnd));
    const b = { id: idx, ...t, x: (rnd() - 0.5) * 8, z: -55, state: 'walking', owner: null, base: -1, slot: -1, mesh: null, surfY: 0.3 };
    b.mesh = buildBlobMesh(b);
    b.mesh.traverse(o => o.userData.sabBlob = idx);
    game.scene.add(b.mesh);
    blobs.set(idx, b);
  }
  function removeBlob(idx) {
    const b = blobs.get(idx);
    if (b?.mesh) game.scene.remove(b.mesh);
    blobs.delete(idx);
  }
  function refreshHud() {
    const mine = [...blobs.values()].filter(b => b.owner === game.myId && b.state === 'owned');
    coinsEl.textContent = Math.floor(coins).toLocaleString();
    incEl.textContent = mine.reduce((s, b) => s + b.income, 0) * incomeMult();
    ownedEl.textContent = mine.length;
    if (Date.now() - rebArmAt >= 4000) rebBtn.textContent = `♻️×${rebirths} Rebirth ${rebirthCost().toLocaleString()}`;
    saveProgress(); // autosave on every HUD refresh (buys, events, income ticks)
  }
  function playerPos(pid) {
    if (pid === game.myId) return game.pos;
    return game.players.get(pid)?.char?.position || null;
  }
  function playerName(pid) {
    if (pid === game.myId) return game.me?.name || 'You';
    return game.players.get(pid)?.name || 'Someone';
  }
  // Wire transport: server.js is at the push size cap, so blob events ride the
  // existing jam relay (server broadcasts any jam track < 20 chars). Format:
  // 'blob:<action>:<id>' — game.js intercepts these before the jam handler.
  function sendBlob(a, b) { game.send({ t: 'jam', track: 'blob:' + a + ':' + b }); }
  function onBlobWire(fromId, track) {
    const parts = track.split(':');
    if (parts.length !== 3) return;
    onBlob({ id: fromId, a: parts[1], b: Number(parts[2]) });
  }

  // --- remote events (from the blob relay) ---
  function onBlob(m) {
    const from = m.id, a = m.a, bid = m.b;
    if (a === 'buy') {
      let b = blobs.get(bid);
      if (!b) { spawnBlob(bid); b = blobs.get(bid); }
      if (!b) return;
      if (bid === SCOUT_BLOB_ID) {
        // the Scout grant: placed straight into the owner's base, never walked the belt
        if (b.state === 'owned' && b.owner === from) return;
        const base = baseFor(from);
        const slot = freeSlot(base);
        if (slot < 0) return;
        b.state = 'owned'; b.owner = from; b.base = base; b.slot = slot;
        const p = sabSlotPos(base, slot);
        b.x = p.x; b.z = p.z; b.surfY = 0.72;
        drawLabel(b);
      } else {
        if (b.state !== 'walking') return;
        const base = baseFor(from);
        const slot = freeSlot(base);
        if (slot < 0) return;
        b.state = 'returning'; b.owner = from; b.base = base; b.slot = slot;
        burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
        game.sys(`🫧 ${playerName(from)} bought ${b.name}!`);
      }
    } else if (a === 'steal') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'owned') return;
      steals.set(from, { blobId: bid, endsAt: Date.now() + 3000 });
    } else if (a === 'grab') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'owned') return;
      if (b.noSteal) return; // the Scout Blob can never be carried off
      b.state = 'following'; b.thief = from; b.owner = null;
      steals.delete(from);
      burst(b.x, 1.5, b.z, 0xff5e8a); drawLabel(b);
      game.sys(`🫧 ${playerName(from)} grabbed ${b.name}!`);
    } else if (a === 'deliver') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'following') return;
      const base = baseFor(from);
      const slot = freeSlot(base);
      if (slot < 0) { b.state = 'owned'; b.owner = from; b.base = base; b.slot = -1; return; }
      b.state = 'returning'; b.owner = from; b.base = base; b.slot = slot; b.thief = null;
      burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
      game.sys(`🫧 ${playerName(from)} stole ${b.name}!`);
    } else if (a === 'sell') {
      const b = blobs.get(bid);
      if (b && b.owner === from && (b.state === 'owned' || b.state === 'returning')) removeBlob(bid);
    } else if (a === 'reb') {
      if (bid === from) { // track id must be the sender's own pid (anti-grief)
        applyRebirth(from);
        if (from !== game.myId) game.sys(`♻️ ${playerName(from)} rebirthed!`);
      }
    } else if (a === 'slap') {
      const target = bid;
      steals.delete(target);
      if (target === game.myId) {
        // knockback away from the slapper
        const sp = playerPos(from);
        if (sp) {
          const dx = game.pos.x - sp.x, dz = game.pos.z - sp.z;
          const d = Math.max(0.1, Math.hypot(dx, dz));
          game.pos.x += dx / d * 6; game.pos.z += dz / d * 6;
        }
        if (mySteal) { mySteal = null; game.sys('👋 Slapped! Your steal was stopped!'); }
      } else {
        game.sys(`👋 ${playerName(from)} slapped ${playerName(target)}!`);
      }
    }
    refreshHud();
  }

  // --- local actions ---
  function doBuy(b) {
    if (b.state !== 'walking') return;
    if (game.pos.distanceTo(new THREE.Vector3(b.x, game.pos.y, b.z)) > 8) { game.sys('Too far from that blob!'); return; }
    if (coins < b.price) { game.sys('Not enough Blob Coins!'); return; }
    const slot = freeSlot(myBase());
    if (slot < 0) { game.sys('Your base is full!'); return; }
    coins -= b.price;
    b.state = 'returning'; b.owner = game.myId; b.base = myBase(); b.slot = slot;
    burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
    sendBlob('buy', b.id);
    game.sys(`🫧 You bought ${b.name}!`);
    refreshHud();
  }
  function doSell(b) {
    if (b.state !== 'owned' || b.owner !== game.myId) return;
    const refund = Math.floor(b.price / 2);
    coins += refund;
    removeBlob(b.id);
    sendBlob('sell', b.id);
    game.sys(`💰 Sold ${b.name} for ${refund} Blob Coins`);
    refreshHud();
  }
  // Rebirth wipes a player's blobs: owned/returning are removed, a blob they
  // were carrying drops back onto the belt. Applied locally for the rebirther
  // and mirrored on every other client via the 'reb' relay.
  function applyRebirth(pid) {
    for (const b of [...blobs.values()]) {
      if (b.owner === pid && (b.state === 'owned' || b.state === 'returning')) removeBlob(b.id);
      else if (b.thief === pid && b.state === 'following') { b.state = 'walking'; b.thief = null; b.owner = null; b.z = -55; b.x = Math.max(-4, Math.min(4, b.x)); drawLabel(b); }
    }
    steals.delete(pid);
    if (pid === game.myId) mySteal = null;
  }
  function doRebirth() {
    const cost = rebirthCost();
    if (coins < cost) { game.sys(`♻️ You need ${cost.toLocaleString()} Blob Coins to rebirth (you have ${Math.floor(coins).toLocaleString()})`); refreshHud(); return; }
    sendBlob('reb', game.myId);
    applyRebirth(game.myId);
    coins = startCoins();
    rebirths++;
    game.sys(`♻️ REBIRTH! Your income is now ×${incomeMult()} forever.`);
    refreshHud();
  }
  function doSteal(b) {
    if (b.state !== 'owned' || b.owner === game.myId) return;
    if (b.noSteal) { game.sys(`🖤 ${b.name} can't be stolen — it belongs to @scout!`); return; }
    if (game.pos.distanceTo(new THREE.Vector3(b.x, game.pos.y, b.z)) > 8) { game.sys('Too far from that blob!'); return; }
    mySteal = { blobId: b.id, endsAt: Date.now() + (hasPass('pass_faststeal') ? 1500 : 3000) };
    steals.set(game.myId, mySteal);
    sendBlob('steal', b.id);
    game.sys(`🫧 Stealing ${b.name}… stay close!`);
  }
  function doSlap(pid) {
    const now = Date.now();
    if (now - lastSlap < 2000) return;
    lastSlap = now;
    const pp = playerPos(pid);
    if (!pp) return;
    if (game.pos.distanceTo(new THREE.Vector3(pp.x, game.pos.y, pp.z)) > 6) { game.sys('Too far to slap!'); return; }
    sendBlob('slap', pid);
    const stopped = steals.has(pid);
    steals.delete(pid);
    if (stopped) game.sys(`👋 You slapped ${playerName(pid)} and stopped the steal!`);
    else game.sys(`👋 You slapped ${playerName(pid)}!`);
  }

  // --- clicks ---
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let downPos = null;
  function onDown(e) { downPos = [e.clientX, e.clientY]; }
  function onUp(e) {
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
    downPos = null;
    if (moved > 6) return; // was a camera drag
    if (e.target !== game.canvas) return;
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, game.camera);
    const hits = ray.intersectObjects([...blobs.values()].map(b => b.mesh).filter(Boolean), true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && o.userData.sabBlob === undefined) o = o.parent;
      if (o) {
        const b = blobs.get(o.userData.sabBlob);
        if (b) {
          if (b.state === 'walking') doBuy(b);
          else if (b.state === 'owned' && b.owner !== game.myId) doSteal(b);
          else if (b.state === 'owned' && sellMode) doSell(b);
          return;
        }
      }
    }
    const phits = ray.intersectObjects([...game.players.values()].map(p => p.char).filter(Boolean), true);
    if (phits.length) {
      // find nearest player to the hit point
      let best = null, bd = 1e9;
      for (const [pid, p] of game.players) {
        const d = p.char.position.distanceTo(phits[0].point);
        if (d < bd) { bd = d; best = pid; }
      }
      if (best != null && bd < 4) doSlap(best);
    }
  }
  game.canvas.addEventListener('pointerdown', onDown);
  game.canvas.addEventListener('pointerup', onUp);

  // --- tick ---
  let lastIncome = 0;
  function tick(dt, now) {
    const t = Date.now();
    // restore saved progress as soon as your player id is known (before the
    // beacon, so the beacon marks your restored base)
    if (!restoredSave && game.myId != null) restoreSave();
    if (game.myId != null && !scoutGrantChecked) { scoutGrantChecked = true; grantScoutBlob(); }
    // claim + mark your base as soon as your player id is known; move the
    // marker (quietly) if your rank — and so your base — changed
    if (!baseMarker && game.myId != null) makeBaseMarker();
    else if (baseMarker && game.myId != null && myBase() !== baseMarker.idx) {
      game.scene.remove(baseMarker.grp); baseMarker = null; makeBaseMarker(true);
    }
    if (baseMarker) baseMarker.ringMat.opacity = 0.6 + Math.sin(t / 500) * 0.3;
    // keep every owned blob in its owner's current base: heals transient
    // disagreements (e.g. two players joining at the same instant) and the
    // shuffle when someone leaves mid-game
    noteLeavers();
    for (const b of blobs.values()) {
      if ((b.state === 'owned' || b.state === 'returning') && b.owner != null) {
        const want = baseFor(b.owner);
        if (want !== b.base) {
          const slot = freeSlot(want);
          if (slot >= 0) {
            b.base = want; b.slot = slot;
            // 'owned' blobs sit still (their x/z only change while
            // returning), so send them gliding to the new slot instead of
            // leaving them stranded in the old base
            if (b.state === 'owned') b.state = 'returning';
          }
        }
      }
    }
    // deterministic spawning
    if (t - lastSpawn > 2500) {
      lastSpawn = t;
      const walking = [...blobs.values()].filter(b => b.state === 'walking').length;
      if (walking < 12) spawnBlob(spawnIdx++);
    }
    // my steal timer
    if (mySteal) {
      const sb = blobs.get(mySteal.blobId);
      if (!sb || sb.state !== 'owned' || game.pos.distanceTo(new THREE.Vector3(sb.x, game.pos.y, sb.z)) > 8) {
        mySteal = null; steals.delete(game.myId); // moved away or blob gone: cancel
      } else if (t >= mySteal.endsAt) {
        mySteal = null;
        sb.state = 'following'; sb.thief = game.myId; sb.owner = null;
        burst(sb.x, 1.5, sb.z, 0xff5e8a); drawLabel(sb);
        sendBlob('grab', sb.id);
        game.sys(`🫧 You grabbed ${sb.name}! Run to your base!`);
      }
    }
    // expire stale remote steals
    for (const [pid, s] of steals) if (t > s.endsAt + 1000) steals.delete(pid);
    // blob movement
    for (const b of [...blobs.values()]) {
      if (b.state === 'walking') {
        b.z += 5 * dt; b.surfY = 0.3;
        if (b.z > 55) removeBlob(b.id);
      } else if (b.state === 'returning') {
        const p = sabSlotPos(b.base, b.slot);
        const dx = p.x - b.x, dz = p.z - b.z;
        const d = Math.hypot(dx, dz);
        // rise smoothly from belt height to pad height as it nears its slot
        b.surfY = 0.3 + 0.42 * (1 - Math.min(1, d / 6));
        if (d < 0.5) { b.x = p.x; b.z = p.z; b.state = 'owned'; b.surfY = 0.72; }
        else { b.x += dx / d * 8 * dt; b.z += dz / d * 8 * dt; }
      } else if (b.state === 'following') {
        b.surfY = 0.3;
        const tp = playerPos(b.thief);
        if (!tp) { b.state = 'owned'; continue; }
        const dx = tp.x - b.x, dz = tp.z - b.z;
        const d = Math.hypot(dx, dz);
        if (d > 2) { b.x += dx / d * 7 * dt; b.z += dz / d * 7 * dt; }
        if (b.thief === game.myId) {
          const bp = SAB_BASES[myBase()];
          if (Math.hypot(game.pos.x - bp.x, game.pos.z - bp.z) < 8) {
            const slot = freeSlot(myBase());
            if (slot >= 0) {
              b.state = 'returning'; b.owner = game.myId; b.base = myBase(); b.slot = slot; b.thief = null;
              burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
              sendBlob('deliver', b.id);
              game.sys(`🫧 You stole ${b.name}!`);
            }
          }
        }
      }
      if (b.mesh) {
        const refs = b.mesh.userData.refs;
        const moving = b.state !== 'owned';
        // face movement direction (smooth turn)
        const dx = b.x - (b.px ?? b.x), dz = b.z - (b.pz ?? b.z);
        if (Math.abs(dx) + Math.abs(dz) > 0.001) {
          const target = Math.atan2(dx, dz);
          let d = target - b.mesh.rotation.y;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          b.mesh.rotation.y += d * Math.min(1, dt * 10);
        }
        b.px = b.x; b.pz = b.z;
        // squash & stretch + bob + waddle
        const ph = t / 1000 * (moving ? 7 : 2.2) + b.id * 1.3;
        const sq = Math.sin(ph);
        const sy = 0.85 + sq * (moving ? 0.1 : 0.04);
        refs.body.scale.set(1 - sq * 0.05, sy, 1 - sq * 0.05);
        const groundY = b.state === 'owned' ? 0.72 : (b.surfY ?? 0.3);
        b.mesh.position.set(b.x, groundY + Math.abs(Math.sin(ph)) * 0.18, b.z);
        refs.feet[0].position.y = 0.24 + (moving ? Math.max(0, Math.sin(ph)) * 0.22 : 0);
        refs.feet[1].position.y = 0.24 + (moving ? Math.max(0, Math.sin(ph + Math.PI)) * 0.22 : 0);
        refs.arms[0].rotation.z = Math.sin(ph) * 0.35;
        refs.arms[1].rotation.z = -Math.sin(ph) * 0.35;
        // blink every few seconds
        const blink = ((t / 1000 + b.id * 1.7) % 3.7) < 0.12 ? 0.12 : 1;
        for (const e of refs.eyes) e.scale.y = blink;
        // rarity ring pulse + glow
        refs.ring.material.emissiveIntensity = 0.7 + Math.sin(t / 500 + b.id) * 0.35;
        const gs = 1 + Math.sin(t / 500 + b.id) * 0.08;
        refs.glowDisc.scale.set(gs, gs, 1);
        if (refs.sparkles) refs.sparkles.rotation.y = t / 1000;
        if (refs.aura) refs.aura.material.opacity = 0.4 + Math.sin(t / 500 + b.id) * 0.15;
        if (refs.halo) { refs.halo.rotation.y = t / 1000 * 0.8; refs.halo.position.y = 2.75 + Math.sin(t / 800) * 0.08; }
        if (refs.spinHat) { refs.spinHat.rotation.y = t / 1000 * 2; refs.spinHat.position.y = 2.65 + Math.sin(t / 700) * 0.1; }
        // rainbow blob cycles hue
        if (b.name === 'Rainbow Blob' || b.name === 'Galaxy Blob') refs.bodyMat.color.setHSL(((t / 3000) + b.id * 0.13) % 1, 0.85, 0.6);
      }
    }
    tickBursts(dt);
    // income
    if (t - lastIncome > 1000) {
      lastIncome = t;
      let inc = 0;
      for (const b of blobs.values()) if (b.owner === game.myId && b.state === 'owned') inc += b.income;
      coins += inc * incomeMult();
      refreshHud();
    }
  }
  // seed a few blobs immediately
  coins = startCoins(); // Big Start pass; a restored save overrides this on the first tick
  for (let i = 0; i < 6; i++) spawnBlob(spawnIdx++);
  refreshHud();
  game.sys('🫧 Steal a Blob! Buy blobs on the conveyor, steal from rivals, slap thieves!');

  return {
    tick,
    onBlob,
    onBlobWire,
    destroy() {
      saveProgress(); // final flush on leaving the game
      game.canvas.removeEventListener('pointerdown', onDown);
      game.canvas.removeEventListener('pointerup', onUp);
      for (const b of blobs.values()) if (b.mesh) game.scene.remove(b.mesh);
      for (const br of bursts) game.scene.remove(br.grp);
      bursts.length = 0;
      blobs.clear();
      if (baseMarker) game.scene.remove(baseMarker.grp);
      hud.remove(); style.remove(); panel.remove();
    },
  };
}
