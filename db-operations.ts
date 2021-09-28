import { Db } from 'mongodb';
import { COLLECTIONS } from "./config/constants";

// Lista de personaje

export async function getCharacters(db: Db) {
  return await db
    .collection(COLLECTIONS.CHARACTERS)
    .find()
    .sort({ id: 1 })
    .toArray();
}

// Personaje seleccionado

export async function getCharacter(db: Db, id: string) {
  return await db.collection(COLLECTIONS.CHARACTERS).findOne({ id });
}

// Voto seleccionado

// Personaje seleccionado

export async function getVote(db: Db, id: string) {
  return await db.collection(COLLECTIONS.VOTES).findOne({ id });
}

// Votos de un personajes

export async function getCharacterVotes(db: Db, id: string) {
  return await db.collection(COLLECTIONS.VOTES).find({ character: id }).count();
}

// Obtener el id del nuevo voto

export async function asignVoteId(db: Db) {
  const lastVotes = await db
    .collection(COLLECTIONS.VOTES)
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  if (lastVotes.length === 0) {
    return "1";
  }
  return String(+lastVotes[0].id + 1);
}
