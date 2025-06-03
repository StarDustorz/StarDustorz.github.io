---
abbrlink: golang-benchyou
published: 2021-10-11
tags:
- Golang
- Packges
title: Golang Benchyou
---

> benchyou is a benchmark tool for MySQL, real-time monitoring TPS and vmstat/iostat

<!--more-->

## 1 Build
```shell
$ git clone https://github.com/xelabs/benchyou
$ cd benchyou
$ make build
```

## 2 Usage

```shell
$ ./bin/benchyou -h
```

## 3 Examples

```shell
prepare 64 tables:
./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou  --oltp-tables-count=64 prepare

cleanup 64 tables:
./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou  --oltp-tables-count=64 cleanup

random insert(Write/Read Ratio=128:8):
 ./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou --ssh-user=benchyou --ssh-password=benchyou --oltp-tables-count=64 --write-threads=128 --read-threads=8 --max-time=3600 random

sequential insert(Write/Read Ratio=128:8):
 ./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou --ssh-user=benchyou --ssh-password=benchyou --oltp-tables-count=64 --write-threads=128 --read-threads=8 --max-time=3600 seq

mix(Write/Read/Update/Delete Ratio=4:4:4:4):
 ./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou --ssh-user=benchyou --ssh-password=benchyou --oltp-tables-count=64 --write-threads=4 --read-threads=4 --update-threads=4 --delete-threads=4 --max-time=3600 random

insert multiple rows(10 rows per insert):
 ./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou --ssh-user=benchyou --ssh-password=benchyou --oltp-tables-count=64 --write-threads=4 --rows-per-insert=10 --max-time=3600 random

batch update(10 rows per transaction):
 ./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou --ssh-user=benchyou --ssh-password=benchyou --oltp-tables-count=64 --update-threads=4 --batch-per-commit=10 --max-time=3600 random

query-range(Write/Read Ratio=128:8):
 ./bin/benchyou  --mysql-host=192.168.0.3 --mysql-user=benchyou --mysql-password=benchyou --ssh-user=benchyou --ssh-password=benchyou --oltp-tables-count=64 --write-threads=128 --read-threads=8 --max-time=3600 --mysql-range-order=DESC range
```

## 4 Github

- [benchyou](https://github.com/xelabs/benchyou)