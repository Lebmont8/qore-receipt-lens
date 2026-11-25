# Qore Receipt Lens
A read-only Diana testnet transaction inspector. It separates execution status, raw-byte SHA-256 identity and structural ML-DSA-87 extension evidence from actual cryptographic signature verification.

## Run
Node.js 22+; no packages are required.
~~~sh
node --test test/*.test.mjs
node server.mjs
~~~
Open http://127.0.0.1:4173. Import a captured receipt bundle, look up a transaction explicitly, or load the labelled synthetic example. The example is not a real transaction and contains invalid zero-filled signatures.

The optional QoreX adapter requests a public address only; it does not sign. RPC observations trust the endpoint. This implementation does not verify signatures or consensus inclusion. Network access may be blocked or unavailable.

The working interface uses native HTML and JavaScript ES modules. It is not the React scaffold that was consulted during preparation. Protocol field definitions derive from qorechain/qorechain-sdk revision ca43a4649897a01499311448e33d6c129718ee51.

No testnet deployment, competition registration, award or payment is claimed. Apache-2.0; upstream attribution is preserved in NOTICE. Original Lens logic developed with AI assistance.

## Continuous integration
A reference GitHub Actions workflow is included at ci/github-actions.yml. To activate it in your own repository, place it under .github/workflows/. Its presence as a reference does not mean hosted CI is enabled or has passed.
