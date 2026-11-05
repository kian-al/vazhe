import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('catalog has real classic extraction and no invented commercial word lists',async()=>{
 const books=JSON.parse(await readFile('data/books-catalog.json','utf8')) as {id:string;collection:string;source:string;chapters:{id:string;wordIds:string[]}[]}[];
 assert.equal(books.length,10);assert.equal(new Set(books.map(b=>b.id)).size,10);
 for(const book of books){assert.equal(new Set(book.chapters.map(c=>c.id)).size,book.chapters.length);if(book.collection==='series')assert.ok(book.chapters.every(c=>c.wordIds.length===0));}
 for(const [id,total] of [['alice',12],['prince',5]] as const){const book=books.find(b=>b.id===id)!;assert.equal(book.chapters.length,total);assert.ok(book.source.startsWith('https://www.gutenberg.org/'));assert.ok(book.chapters.every(c=>c.wordIds.length===30&&new Set(c.wordIds).size===30));}
});
test('library table is additive and not available to PUBLIC',async()=>{
 const db=new PGlite();try{await db.exec(await readFile('db/library.sql','utf8'));await db.exec('CREATE ROLE library_visitor');await db.exec('SET ROLE library_visitor');await assert.rejects(db.query('SELECT * FROM library_books'),/permission denied/);}finally{await db.close()}
});
