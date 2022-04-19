let a = true
let count = 1

setTimeout(() => {
    a = false
}, 3)

while (a) {
    count += 1
    console.log(count)
}