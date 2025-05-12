---
title: "[Go] Golang Concatenate Strings"
date: 2021-08-17
tags:
  - Golang
categories:
  - 技术
  - Golang
published: true
toc: "true"
comments: "true"
description:
---
>How to Efficiently Concatenate Strings in Go

<!--more-->

## 1 种拼接方式
### 1.1 String Concat

Str += "hello-world"
### 1.2 String Sprintf

```go
Str = fmt.Sprintf ("%s%s", str, "hello-world")
```
### 1.3 String Join
```go
Str = strings.Join ([]string{str, "hello-world"}, "")
```
### 1.4 Buffer Write

```go
Buf := new (bytes. Buffer)
Buf.WriteString ("hello-world")
Str := buf.String ()
```
### 1.5 Bytes Append

```go
Var b []byte
S := "hello-world"
b = append (b, s...)
Str := string (b)
```
### 1.6 String Copy

```go
Ts := "hello-world"
N := 5
Tsl := len (ts) * n
Bs := make ([]byte, tsl)
Bl := 0

For bl < tsl {
    Bl += copy (bs[bl:], ts)
}

Str := string (bs)
```
### 1.7 String Builder
From Go 1.10 there is a strings. Builder type

```go
Var builder strings. Builder
Builder.WriteString ("hello-world")
Str := builder.String ()
```
## 2 Benchmark
  
```go
Package main

Import (
    "bytes"
    "fmt"
    "strings"
    "testing"
)

Const (
    Sss = "xfoasneobfasieongasbg"
    Cnt = 10000
)

Var (
    Bbb      = []byte (sss)
    Expected = strings.Repeat (sss, cnt)
)

Func BenchmarkCopyPreAllocate (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Bs := make ([]byte, cnt*len (sss))
        Bl := 0
        For i := 0; i < cnt; i++ {
            Bl += copy (bs[bl:], sss)
        }
        Result = string (bs)
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkAppendPreAllocate (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Data := make ([]byte, 0, cnt*len (sss))
        For i := 0; i < cnt; i++ {
            Data = append (data, sss...)
        }
        Result = string (data)
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkBufferPreAllocate (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Buf := bytes.NewBuffer (make ([]byte, 0, cnt*len (sss)))
        For i := 0; i < cnt; i++ {
            Buf.WriteString (sss)
        }
        Result = buf.String ()
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkCopy (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Data := make ([]byte, 0, 64) // same size as bootstrap array of bytes. Buffer
        For i := 0; i < cnt; i++ {
            Off := len (data)
            If off+len (sss) > cap (data) {
                Temp := make ([]byte, 2*cap (data)+len (sss))
                Copy (temp, data)
                Data = temp
            }
            Data = data[0 : off+len (sss)]
            Copy (data[off:], sss)
        }
        Result = string (data)
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkCopyX (b *testing. B) {
    bs := make ([]byte, b.N)
    Bl := 0

    b.ResetTimer()
    for n := 0; n < b.N; n++ {
        bl += copy(bs[bl:], "x")
    }
    b.StopTimer()

    if s := strings.Repeat("x", b.N); string(bs) != s {
        b.Errorf("unexpected result; got=%s, want=%s", string(bs), s)
    }
}

Func BenchmarkAppend (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Data := make ([]byte, 0, 64)
        For i := 0; i < cnt; i++ {
            Data = append (data, sss...)
        }
        Result = string (data)
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkBufferWrite (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var buf bytes. Buffer
        For i := 0; i < cnt; i++ {
            Buf.Write (bbb)
        }
        Result = buf.String ()
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkBufferWriteString (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var buf bytes. Buffer
        For i := 0; i < cnt; i++ {
            Buf.WriteString (sss)
        }
        Result = buf.String ()
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkConcatString (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var str string
        For i := 0; i < cnt; i++ {
            Str += sss
        }
        Result = str
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkConcat (b *testing. B) {
    Var str string
    for n := 0; n < b.N; n++ {
        Str += "x"
    }
    b.StopTimer ()

    if s := strings.Repeat("x", b.N); str != s {
        b.Errorf("unexpected result; got=%s, want=%s", str, s)
    }
}

Func BenchmarkBuffer (b *testing. B) {
    Var buffer bytes. Buffer
    for n := 0; n < b.N; n++ {
        Buffer.WriteString ("x")
    }
    b.StopTimer ()

    if s := strings.Repeat("x", b.N); buffer.String() != s {
        b.Errorf("unexpected result; got=%s, want=%s", buffer.String(), s)
    }
}

// Go 1.10
Func BenchmarkStringBuilderX (b *testing. B) {
    Var strBuilder strings. Builder

    b.ResetTimer()
    for n := 0; n < b.N; n++ {
        strBuilder.WriteString("x")
    }
    b.StopTimer()

    if s := strings.Repeat("x", b.N); strBuilder.String() != s {
        b.Errorf("unexpected result; got=%s, want=%s", strBuilder.String(), s)
    }
}

Func BenchmarkStringBuilder (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var builder strings. Builder

        for i := 0; i < cnt; i++ {
            builder.WriteString(sss)
        }

        result = builder.String()
    }
    b.StopTimer()
    if result != expected {
        b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
    }
}

Func BenchmarkStringConcat (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var str string
        For i := 0; i < cnt; i++ {
            Str += sss
        }
        Result = str
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkStringSprintf (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var str string
        For i := 0; i < cnt; i++ {
            Str = fmt.Sprintf ("%s%s", str, sss)
        }
        Result = str
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkStringJoin (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var str string
        For i := 0; i < cnt; i++ {
            Str = strings.Join ([]string{str, sss}, "")
        }
        Result = str
    }
    b.StopTimer ()
    If result != expected {
        b.Errorf ("unexpected result; got=%s, want=%s", string (result), expected)
    }
}

Func BenchmarkBytesAppend (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Var bbb []byte

        for i := 0; i < cnt; i++ {
            bbb = append(bbb, sss...)
        }
        result = string(bbb)
    }
    b.StopTimer()
    if result != expected {
        b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
    }
}

Func BenchmarkStringCopy (b *testing. B) {
    Var result string
    for n := 0; n < b.N; n++ {
        Tsl := len (sss) * cnt
        Bs := make ([]byte, tsl)
        Bl := 0

        for bl < tsl {
            bl += copy(bs[bl:], sss)
        }

        result = string(bs)
    }
    b.StopTimer()
    if result != expected {
        b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
    }
}
```

Test Results:

```shell
Go test -v strings_concat_benchmark_test. Go -bench=. -benchmem
Goos: darwin
Goarch: amd 64
BenchmarkCopyPreAllocate-4          8043            125464 ns/op          425984 B/op          2 allocs/op
BenchmarkAppendPreAllocate-4        9818            126881 ns/op          425985 B/op          2 allocs/op
BenchmarkBufferPreAllocate-4        7656            161158 ns/op          425984 B/op          2 allocs/op
BenchmarkCopy-4                     4903            250800 ns/op          929185 B/op         13 allocs/op
BenchmarkCopyX-4                263460769                5.19 ns/op            0 B/op          0 allocs/op
BenchmarkAppend-4                   3820            384086 ns/op         1333122 B/op         24 allocs/op
BenchmarkBufferWrite-4              3626            299617 ns/op          929250 B/op         14 allocs/op
BenchmarkBufferWriteString-4        4428            286061 ns/op          929249 B/op         14 allocs/op
BenchmarkConcatString-4                5         210904237 ns/op        1086401044 B/op    10037 allocs/op
BenchmarkConcat-4                1000000            118204 ns/op          503996 B/op          1 allocs/op
BenchmarkBuffer-4               132420037                8.74 ns/op            2 B/op          0 allocs/op
BenchmarkStringBuilderX-4       418325671                5.97 ns/op            6 B/op          0 allocs/op
BenchmarkStringBuilder-4            3890            310115 ns/op         1120224 B/op         25 allocs/op
BenchmarkStringConcat-4                5         229555747 ns/op        1086401641 B/op    10050 allocs/op
BenchmarkStringSprintf-4               3         451219496 ns/op        2068371440 B/op    35040 allocs/op
BenchmarkStringJoin-4                  4         281371101 ns/op        1086401946 B/op    10058 allocs/op
BenchmarkBytesAppend-4              3406            406706 ns/op         1333218 B/op         26 allocs/op
BenchmarkStringCopy-4               9100            133990 ns/op          425984 B/op          2 allocs/op
PASS
Ok      command-line-arguments  148.510 s
```
## 3 参考

- [How to Efficiently Concatenate Strings in Go](https://stackoverflow.com/questions/1760757/how-to-efficiently-concatenate-strings-in-go)