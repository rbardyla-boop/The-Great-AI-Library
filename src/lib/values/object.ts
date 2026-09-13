import { canonicalJson, objectPath, sha256Text, utf8 } from "../kernel/crypto.ts";
import type { ContentAddressedStore } from "../kernel/objects.ts";
import type { ValuesProfile } from "./types.ts";

/** Deterministic evaluator. Not a generative model. */
export const VALUES_EVALUATOR = "gal-values-eval/1.0";
/** Six roles, one base. VALUES differ; the checkpoint does not. */
export const VALUES_CHECKPOINT = "openhive-identical-base-6";

export function unsignedProfile(profile: ValuesProfile): Omit<ValuesProfile, "hash"> {
  const unsigned: Omit<ValuesProfile, "hash"> = {
    uri: profile.uri,
    role: profile.role,
    name: profile.name,
    version: profile.version,
    emphasis: profile.emphasis,
    constitutional: profile.constitutional,
    preferences: profile.preferences,
  };
  if (profile.specialist) unsigned.specialist = profile.specialist;
  return unsigned;
}

export function valuesCanonical(profile: ValuesProfile): string {
  return canonicalJson(unsignedProfile(profile));
}

export async function putValuesObject(
  objects: ContentAddressedStore,
  profile: ValuesProfile,
): Promise<{ hash: string; path: string; wrote: boolean }> {
  const put = await objects.put(utf8(valuesCanonical(profile)));
  if (put.hash !== profile.hash) {
    throw new Error(
      `VALUES object hash ${put.hash.slice(0, 8)} !== profile hash ${profile.hash.slice(0, 8)}`,
    );
  }
  return { hash: put.hash, path: objectPath(put.hash), wrote: put.wrote };
}

export async function verifyValuesObject(
  objects: ContentAddressedStore,
  profile: ValuesProfile,
): Promise<boolean> {
  const bytes = objects.get(profile.hash);
  if (!bytes) return false;
  return (await sha256Text(new TextDecoder().decode(bytes))) === profile.hash;
}
