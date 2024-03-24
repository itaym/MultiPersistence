import { spawn } from 'child_process'

const childProcess = spawn('node', ['./process.js']);
let sendCount = 0
let receivedCount = 0
// Listen for messages from the child process
childProcess.stdout.on('data', (data) => {

    receivedCount += data.toString().split(',').length - 1
    console.table({sendCount, receivedCount, data: data.toString()})
    //console.log(`Received message from child process: ${data}\n`);
});

// Handle errors
childProcess.stderr.on('data', (data) => {
    console.error(`Error from child process: ${data}\n`);
});
let c=0
let h = setInterval(() => {
    c++
    if (c === 50_000) clearInterval(h)
    childProcess.stdin.write(`${++sendCount},`);
}, 0)

// Handle child process exit
childProcess.on('exit', (code) => {
    console.log(`Child process exited with code ${code}\n`);
});