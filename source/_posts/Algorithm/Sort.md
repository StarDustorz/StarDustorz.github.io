---
title: "[Algorithm] Sort"
date: 2021-06-12 19:29:17
tags:
  - Algorithm
categories:
  - Algorithm
published: true
toc: "true"
comments: "true"
description: 排序总结
---

<!--more-->
## 排序算法的比较

| **算法**         | **稳定性** | **时间复杂度**              | **空间复杂度** | **备注**                 |
| ---------------- | ---------- | --------------------------- | -------------- | ------------------------ |
| 选择排序         | ×          | N2                          | 1              |                          |
| 冒泡排序         | √          | N2                          | 1              |                          |
| 插入排序         | √          | N ~ N2                      | 1              | 时间复杂度和初始顺序有关 |
| 希尔排序         | ×          | N的若干倍乘于递增序列的长度 | 1              | 改进版插入排序           |
| 快速排序         | ×          | NlogN                       | logN           |                          |
| 三向切分快速排序 | ×          | N ~ NlogN                   | logN           | 适用于有大量重复主键     |
| 归并排序         | √          | NlogN                       | N              |                          |
| 堆排序           | ×          | NlogN                       | 1              | 无法利用局部性原理       |

快速排序是最快的通用排序算法，它的内循环的指令很少，而且它还能利用缓存，因为它总是顺序地访问数据。它的运行时间近似为 ~cNlogN，这里的 c 比其它线性对数级别的排序算法都要小。

使用三向切分快速排序，实际应用中可能出现的某些分布的输入能够达到线性级别，而其它排序算法仍然需要线性对数时间。



## 快速排序

快速排序通过一个切分元素将数组分为两个子数组，左子数组小于等于切分元素，右子数组大于等于切分元素，将这两个子数组排序也就将整个数组排序了。

取 a[l] 作为切分元素，从数组的左端向右扫描直到找到第一个大于等于它的元素，再从数组的右端向左扫描找到第一个小于它的元素，交换这两个元素。不断进行这个过程，就可以保证左指针 i 的左侧元素都不大于切分元素，右指针 j 的右侧元素都不小于切分元素。当两个指针相遇时，将切分元素 a[l] 和 a[j] 交换位置。

为了防止数组最开始就是有序的，在进行快速排序时需要随机打乱数组。

```go
package main
import "fmt"
// 快速排序主函数
func quicksort(arr []int) {
    if len(arr) < 2 {
        return
    }
    left, right := 0, len(arr)-1
    // 选择枢纽元素
    pivot := arr[len(arr)/2]
    // 分区过程
    for left <= right {
        for arr[left] < pivot {
            left++
        }
        for arr[right] > pivot {
            right--
        }

        if left <= right {
            arr[left], arr[right] = arr[right], arr[left]
            left++
            right--
        }
    }
    // 递归排序左右两部分
    if right > 0 {
        quicksort(arr[:right+1])
    }
    if left < len(arr) {
        quicksort(arr[left:])
    }
}
func main() {
    data := []int{10, 7, 8, 9, 1, 5}
    fmt.Println("Unsorted array:", data)
    quicksort(data)
    fmt.Println("Sorted array:", data)
}
```



```java
public class QuickSort extends Sort{
    private int partition(Integer[] nums, int l, int h){
        int i = l, j = h+1;
        Integer v = nums[l];
        while (true){
     	//从左侧向右扫描找到第一个大于等于基准的，再从数组的右端向左扫描找到第一个小于它的元素，交换这两个元素。
            while (less(nums[++i],v) && i != h);
            while (less(v,nums[--j]) && j != l);
            //当两个指针相遇，结束循环
            if(j < i) break;
            swap(nums, i, j);
        }
        swap(nums,l,j);
        return j;
    }
    private void shuffle(Integer[] nums){
        List<Integer> list = Arrays.asList(nums);
        Collections.shuffle(list);
        list.toArray(nums);
    }
    @Override
    public void sort(Integer[] nums) {
        shuffle(nums);
        sort(nums,0,nums.length-1);

    }
    protected void sort(Integer[] nums, int l, int h){
        if(l >= h) return;
        int j = partition(nums, l, h);
        sort(nums, l, j);
        sort(nums, j+1, h);
    }

    protected boolean less(Integer v, Integer w){
        return v < w;
    }
    protected void swap(Integer[] a, int i, int j){
        Integer temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
}
```

### 基于切分的快速选择算法（TopK）

快速排序的partition()方法，会返回一个索引j，j前面的都小于a[j],后面的都大于，也即是返回第j大的元素

可以据此找出第k大元素

```java
public int select(int[] nums, int k){
	int low = 0, high = nums.length - 1;
    while(low < high){
        int j = partition(nums,low,high);
        if(j == k) return nums[k];
        else if(j > k){
            high = j - 1;
        }else{
			low = j + 1;
        }
    }
    return nums[k];
}
```

### 三向切分

对于有大量重复元素的数组，可以将数组切分为三部分，分别对应小于、等于和大于切分元素。

三向切分快速排序对于有大量重复元素的随机数组可以在线性时间内完成排序。

Java 主要排序方法为 java.util.Arrays.sort()，对于原始数据类型使用三向切分的快速排序，对于引用类型使用归并排序。

```java
public class TreeWayQuickSort extends QuickSort{
    @Override
    protected void sort(Integer[] nums, int l, int h){
        if(l>=h) return;
        int lt = l, i = l+1, gt = h;
        Integer v = nums[l];
        while (i<=gt){
            int cmp = nums[i] - v;
            if(cmp < 0){
                swap(nums, lt++, i++);
            }else if(cmp > 0){
                swap(nums, i, gt--);
            }else {
                i++;
            }
        }
        sort(nums, l, lt-1);
        sort(nums, gt+1, h);
    }
}
```



### [215. 数组中的第K个最大元素](https://leetcode.cn/problems/kth-largest-element-in-an-array/)

在未排序的数组中找到第 k 个最大的元素。请注意，你需要找的是数组排序后的第 k 个最大的元素，而不是第 k 个不同的元素。

对子数组进行划分，如果划分得到的 q 正好就是我们需要的下标，就直接返回 a[q]；否则，如果 q 比目标下标小，就递归右子区间，否则递归左子区间。

```java
public class Solution {

    public int findKthLargest(int[] nums, int k) {
        int len = nums.length;
        int left = 0;
        int right = len - 1;
        // 转换一下，第 k 大元素的索引是 len - k
        int target = len - k;

        while (true) {
            int index = partition(nums, left, right);
            if (index == target) {
                return nums[index];
            } else if (index < target) {
                left = index + 1;
            } else {
                right = index - 1;
            }
        }
    }

    public int partition(int[] nums, int left, int right) {
        int pivot = nums[left];
        int j = left;
        for (int i = left + 1; i <= right; i++) {
            if (nums[i] < pivot) {
                j++;
                swap(nums, j, i);
            }
        }
        swap(nums, j, left);
        return j;
    }

    private void swap(int[] nums, int index1, int index2) {
        int temp = nums[index1];
        nums[index1] = nums[index2];
        nums[index2] = temp;
    }
}
```

## 选择排序

选择最小的元素，然后和第一个交换，然后从剩下的元素选最小的和第二个交换，直到将整个数组排序。

```java
public class Selection extends Sort {
    @Override
    public void sort(Integer[] nums) {
        int n = nums.length;
        for(int i = 0; i < n; i++){
            int min = i;
            for(int j = i+1; j < n; j++){	//从剩下的元素中选出最小的元素
                if(less(nums[j], nums[min])){
                    min = j;
                }
            }
            swap(nums, i, min);			//和最小的交换位置
        }
    }

    protected void swap(Integer[] a, int i, int j){
        Integer temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
    protected boolean less(Integer v, Integer w){
        return v < w;
    }
}
```

## 堆排序

### 堆

堆中某个节点的值总是大于等于其子节点的值，并且堆是一颗完全二叉树。

位置 k 的节点的父节点位置为 k/2，而它的两个子节点的位置分别为 2k 和 2k+1。

大根堆： 根节点大于叶子节点  根节点是最大的   根据大根堆可以得到几个最小的

小根堆： 根节点是最小的，输出根节点就是输出最小的

```java
public class Heap<T extends Comparable<T>> {

    private T[] heap;
    private int N = 0;

    public Heap(int maxN) {
        this.heap = (T[]) new Comparable[maxN + 1];
    }

    public boolean isEmpty() {
        return N == 0;
    }

    public int size() {
        return N;
    }

    private boolean less(int i, int j) {
        return heap[i].compareTo(heap[j]) < 0;
    }

    private void swap(int i, int j) {
        T t = heap[i];
        heap[i] = heap[j];
        heap[j] = t;
    }
}
```

### 上浮和下沉

在堆中，当一个节点比父节点大，那么需要交换这个两个节点。交换后还可能比它新的父节点大，因此需要不断地进行比较和交换操作，把这种操作称为上浮。

```java
private void swim(int k) {
    while (k > 1 && less(k / 2, k)) {
        swap(k / 2, k);
        k = k / 2;
    }
}
```

当一个节点比子节点来得小，也需要不断地向下进行比较和交换操作，把这种操作称为下沉。一个节点如果有两个子节点，应当与两个子节点中最大那个节点进行交换。

```java
private void sink(int k) {
    while (2 * k <= N) {
        int j = 2 * k;
        if (j < N && less(j, j + 1))
            j++;
        if (!less(k, j))
            break;
        swap(k, j);
        k = j;
    }
}
```

### 插入

将新元素放到数组末尾，然后上浮到合适的位置。

```java
public void insert(Comparable v) {
    heap[++N] = v;
    swim(N);
}
```

### 删除最大元素

从数组顶端删除最大的元素，并将数组的最后一个元素放到顶端，并让这个元素下沉到合适的位置。

```java
public T delMax() {
    T max = heap[1];
    swap(1, N--);
    heap[N + 1] = null;
    sink(1);
    return max;
}
```

### 堆排序

把最大元素和当前堆中数组的最后一个元素交换位置，并且不删除它，那么就可以得到一个从尾到头的递减序列，从正向来看就是一个递增序列，这就是堆排序。

从右至左进行下沉操作，如果一个节点的两个节点都已经是堆有序，那么进行下沉操作可以使得这个节点为根节点的堆有序。

交换堆顶元素与最后一个元素

交换之后需要进行下沉操作维持堆的有序状态

```java
public class HeapSort<T extends Comparable<T>> extends Sort<T> {
    /**
     * 数组第 0 个位置不能有元素
     */
    @Override
    public void sort(T[] nums) {
        int N = nums.length - 1;
        for (int k = N / 2; k >= 1; k--)
            sink(nums, k, N);

        while (N > 1) {
            swap(nums, 1, N--);
            sink(nums, 1, N);
        }
    }

    private void sink(T[] nums, int k, int N) {
        while (2 * k <= N) {
            int j = 2 * k;
            if (j < N && less(nums, j, j + 1))
                j++;
            if (!less(nums, k, j))
                break;
            swap(nums, k, j);
            k = j;
        }
    }

    private boolean less(T[] nums, int i, int j) {
        return nums[i].compareTo(nums[j]) < 0;
    }
}
```



## 冒泡排序

从左到右不断交换相邻逆序的元素，在一轮的循环之后，可以让未排序的最大元素上浮到右侧。

```java
public class Bubble extends Sort {
    @Override
    public void sort(Integer[] nums) {
        int n = nums.length;
        boolean flag = true;
        for(int i = n-1; i > 0 && flag; i--){
            flag = false;
            for(int j = 0; j < i; j++){
                if(less(nums[j+1],nums[j])){
                    swap(nums,j,j+1);
                    flag = true;
                }
            }
        }
    }
}
```



## 插入排序

每次都将当前元素插入到左侧已经排序的数组中，使得插入之后左侧数组依然有序。

插入排序每次只能交换相邻元素，令逆序数量减少 1，因此插入排序需要交换的次数为逆序数量。

```java
public class Insertion extends Sort {
    @Override
    public void sort(Integer[] nums) {
        int n = nums.length;
        for(int i = 1; i < n; i++){
            for(int j = i; j > 0 && less(nums[j],nums[j-1]); j--){
                swap(nums,j,j-1);
            }
        }
    }
}
```

## 希尔排序

插入排序的优化

通过交换不相邻的元素，每次可以将逆序数量减少大于 1。

使用插入排序对间隔 h 的序列进行排序。通过不断减小 h，最后令 h=1，就可以使得整个数组是有序的。

```java
public class Shell extends Sort {
    @Override
    public void sort(Integer[] nums) {
        int n = nums.length;
        int h = 1;
        while (h < n/3){
            h = 3*h + 1;//1,4,9,13
        }
        while (h >= 1){
            for(int i = h; i < n; i++){
                for(int j = i; j > 0 && less(nums[j],nums[j-h]); j -= h){
                    swap(nums,j,j-h);
                }
            }
            h = h/3;
        }
    }
}
```



## 归并算法

将数组分成两部分，分别进行排序，然后归并起来。

```java
public class MergeSort extends Sort {
    //合并时，需要辅助数组，空间复杂度为 O(N)
    private Integer[] aux;

    //归并方法：将数组中两个已经排序的部分归并成一个。
    //l需要合并的数组左端，m中点，h需要合并的数组右端
    private void merge(Integer[] nums, int l, int m, int h){
        int i = l, j = m+1;
        for(int k = l; k <= h; k++){
            aux[k] = nums[k];//将数据复制到辅助数组
        }
        for(int k = l; k <= h; k++){
            if(i > m){
                nums[k] = aux[j++];
            }else if(j > h){
                nums[k] = aux[i++];
            }else if(aux[i]<=aux[j]){
                nums[k] = aux[i++];
            }else {
                nums[k] = aux[j++];
            }
        }
    }

    //将一个大数组分成两个小数组去求解。
    //因为每次都将问题对半分成两个子问题，这种对半分的算法复杂度一般为 O(NlogN)。
    @Override
    public void sort(Integer[] nums) {
        aux = new Integer[nums.length];
        sort(nums, 0, nums.length-1);
    }

    private void sort(Integer[] nums, int l, int h){
        if(h<=l){
            return;
        }
        int mid = l + (h - l)/2;
        sort(nums, l, mid);
        sort(nums, mid+1, h);
        merge(nums, l, mid, h);
    }
}
```



### 剑指35.数组的逆序对

在数组中的两个数字，如果前面一个数字大于后面的数字，则这两个数字组成一个逆序对。输入一个数组,求出这个数组中的逆序对的总数P。并将P对1000000007取模的结果输出。 即输出P%1000000007

在两个子序列left、right合并过程中，当left中当前元素A大于right中当前元素B时，因为left序列已经有序，所以A后面所有元素都可以与B组成逆序对。

```java
public class Solution {
    int[] aux;
    int count = 0;
    public int InversePairs(int [] array) {
        aux = new int[array.length];
        mergeSort(array, 0, array.length-1);
        return count;
    }
    private void merge(int[] array, int l, int m, int h){
        int i = l, j = m+1;
        for(int k = l; k <= h; k++){
            aux[k] = array[k];
        }
        for(int k = l; k <= h; k++){
            if(i > m){
                array[k] = aux[j++];
            }else if(j > h){
                array[k] = aux[i++];
            }else if(aux[i] <= aux[j]){
                array[k] = aux[i++];
            }else{
                array[k] = aux[j++];
                count = (count + m + 1 - i)%1000000007;
            }
        }
    }
    private void mergeSort(int[] array, int l, int h){
        if(l>=h) return;
        int m = l + (h-l)/2;
        mergeSort(array,l,m);
        mergeSort(array,m+1,h);
        merge(array,l,m,h);
    }
}
```