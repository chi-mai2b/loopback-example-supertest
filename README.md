# loopback-example-supertest

 This project aims to demonstrate a way to test [Loopback applications](https://strongloop.com/get-started/) in a scalable way.
 
 It uses [SuperTest](https://github.com/visionmedia/supertest) to send the requests and test the responses.
 
 Developed with:
 
 * Node v4.4.3
 * [node-inspector](https://www.npmjs.com/package/node-inspector)@0.12.8

## How it works ?

 Each test suit has a test specific data set at each run.
 The tests use the memory data source and boot the app with a dedicated data file.
 Before a test suit is started, it calls `TestUtils.start` with a name, app and data.
 It then creates a file under `tmp` and populates it with the data provided.
  
 This ensures each test can be "clustered" and run separately without impacting each other.

## Tests

 All the tests are located under `test/acceptance`.
 
### Watch test
 
 `./scripts/watch.sh ./test/acceptance/{{test-file-to-watch}}`

### Debug test
  
 `./scripts/debug.sh ./test/acceptance/{{test-file-to-debug}}` 

 Then in another tab:
 `./scripts/start-debugger.sh`

## Notes:

 * The code in `test/acceptance/data/` and `test/mock-factories` is kept bare simple for understandability.
 * Cannot debug and watch in the same time due to port conflict
 * Successful POST requests [should return 201](https://github.com/strongloop/loopback/issues/360)
