import { getInitialHouseTargaryenTreeData } from './src/data/fixtures/house-targaryen.ts';
import { getInitialRiveraChenTreeData } from './src/data/fixtures/rivera-chen.ts';
import { layoutFamilyTree } from './src/lib/layout.ts';

console.log('Testing Targaryen...');
const tg = getInitialHouseTargaryenTreeData();
const resTg = layoutFamilyTree(tg.people, tg.relationships);
const tgIds = resTg.nodes.map(n => n.id);
const tgDups = tgIds.filter((id, i) => tgIds.indexOf(id) !== i);
console.log('Targaryen Duplicates:', Array.from(new Set(tgDups)));

console.log('Testing Rivera-Chen...');
const rc = getInitialRiveraChenTreeData();
const resRc = layoutFamilyTree(rc.people, rc.relationships);
const rcIds = resRc.nodes.map(n => n.id);
const rcDups = rcIds.filter((id, i) => rcIds.indexOf(id) !== i);
console.log('Rivera-Chen Duplicates:', Array.from(new Set(rcDups)));
