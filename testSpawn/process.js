let goalLimit = 50_000_000
process.stdin.on('data', (data) => {
    //console.log(`Received message from parent process: ${data}`);
    let goal = BigInt(Math.round(Math.random() * goalLimit))

    for (let x = 0n; x < goalLimit; x++) {
        x++
        x--
    }
    goalLimit -= 1_000
    process.stdout.write(data);
});