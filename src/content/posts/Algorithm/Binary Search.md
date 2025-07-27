---
title: "[Algorithm] Binary Search"
published: 2021-06-12
tags:
  - Algorithm
lang: zh
toc: true
abbrlink: algorithm-binary-search
---


<!--more-->


二分查找就是不断缩小搜索区间的过程，要注意到区间内的元素不能遗漏

## 1 时间复杂度

二分查找也称为折半查找，每次都能将查找区间减半，这种折半特性的算法时间复杂度为 O(logN)。

## 2 二分查找框架

注意循环不变量

#### 2.1.1 第一种：

如果定义在一个左闭右闭的区间里，也就是[left,right];
循环结束条件： left > right

[left, middle - 1]	[middle + 1, right]

right = mid - 1

left = mid + 1

#### 2.1.2 第二种：在一个在左闭右开的区间里，也就是[left, right)

循环结束条件： left < right

[left, middle)    [middle+1, right)

right  = mid

left = mid + 1

```java
int binarySearch(int[] nums, int target) {
    int left = 0, right = ...;
    while(...) {
        int mid = left + (right - left) / 2;  //防止直接相加出现溢出的情况
        if (nums[mid] == target) {
            ...
        } else if (nums[mid] < target) {
            left = ...
        } else if (nums[mid] > target) {
            right = ...
        }
    }
    return ...;
}
```

## 3 寻找一个数

```java
int binarySearch(int[] nums, int target) {
    int left = 0; 
    int right = nums.length - 1; 
    //循环跳出时，left = right + 1，搜索区间为[right+1,right],也就是说right取到了，right+1没有取到
    while(left <= right) {   //因为right是可以取到的，所以要有=号
        int mid = left + (right - left) / 2;
        if(nums[mid] == target)
            return mid; 
        else if (nums[mid] < target)
            left = mid + 1; 	//因为mid是判断过的，所以可以跳过
        else if (nums[mid] > target)
            right = mid - 1; 
    }
    return -1;
}
```

## 4 寻找左侧边界的二分搜索

```java
int left_bound(int[] nums, int target) {
    if (nums.length == 0) return -1;
    int left = 0;
    int right = nums.length; // 右侧是取不到的，[left,right)
    
    while (left < right) { // 中止时left==right，但是不是闭区间，可以跳出
        int mid = (left + right) / 2;
        if (nums[mid] == target) {  
            right = mid;	//找到target后，缩小上界，不断向左收缩
        } else if (nums[mid] < target) {  //[left,mid) [mid+1,right)
            left = mid + 1;
        } else if (nums[mid] > target) {
            right = mid; // 注意
        }
    }
    return left;
}

//如果找不到目标值
// target 比所有数都大
if (left == nums.length) return -1;
return nums[left] == target ? left : -1;
```

## 5 寻找右侧边界的二分搜索

```java
int right_bound(int[] nums, int target) {
    if (nums.length == 0) return -1;
    int left = 0, right = nums.length;  //[left,right)
    
    while (left < right) {
        int mid = (left + right) / 2;
        if (nums[mid] == target) {		//[left,mid) [mid+1,right),因为mid已经判断过，所以跳过
            left = mid + 1;   //如果找到，缩小下界，同时向右收缩
        } else if (nums[mid] < target) {
            left = mid + 1;		//[left,mid) [mid+1,right)
        } else if (nums[mid] > target) {
            right = mid;
        }
    }
    return left - 1; //因为更新的是left = mid + 1，所以 mid = left - 1
}
```

## 6 逻辑统一

```java
//基本二分
因为我们初始化 right = nums.length - 1
所以决定了我们的「搜索区间」是 [left, right]
所以决定了 while (left <= right)
同时也决定了 left = mid+1 和 right = mid-1

因为我们只需找到一个 target 的索引即可
所以当 nums[mid] == target 时可以立即返回
    
//左侧边界
因为我们初始化 right = nums.length
所以决定了我们的「搜索区间」是 [left, right)
所以决定了 while (left < right)
同时也决定了 left = mid + 1 和 right = mid

因为我们需找到 target 的最左侧索引
所以当 nums[mid] == target 时不要立即返回
而要收紧右侧边界以锁定左侧边界

//右侧边界
因为我们初始化 right = nums.length
所以决定了我们的「搜索区间」是 [left, right)
所以决定了 while (left < right)
同时也决定了 left = mid + 1 和 right = mid

因为我们需找到 target 的最右侧索引
所以当 nums[mid] == target 时不要立即返回
而要收紧左侧边界以锁定右侧边界

又因为收紧左侧边界时必须 left = mid + 1
所以最后无论返回 left 还是 right，必须减一                 
```

### 6.1 合并为闭区间

```java
int binary_search(int[] nums, int target) {
    int left = 0, right = nums.length - 1; 
    while(left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else if (nums[mid] > target) {
            right = mid - 1; 
        } else if(nums[mid] == target) {
            // 直接返回
            return mid;
        }
    }
    // 直接返回
    return -1;
}

int left_bound(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else if (nums[mid] > target) {
            right = mid - 1;
        } else if (nums[mid] == target) {
            // 别返回，锁定左侧边界
            right = mid - 1;
        }
    }
    // 最后要检查 left 越界的情况
    if (left >= nums.length || nums[left] != target)
        return -1;
    return left;
}


int right_bound(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else if (nums[mid] > target) {
            right = mid - 1;
        } else if (nums[mid] == target) {
            // 别返回，锁定右侧边界
            left = mid + 1;
        }
    }
    // 最后要检查 right 越界的情况
    if (right < 0 || nums[right] != target)
        return -1;
    return right;
}
```





## 7 例题

### 7.1 [69. x 的平方根](https://leetcode-cn.com/problems/sqrtx/)

实现 `int sqrt(int x)` 函数。

计算并返回 *x* 的平方根，其中 *x* 是非负整数。

由于返回类型是整数，结果只保留整数的部分，小数部分将被舍去

```java
//在left <= right的情况下，结束时 left = right + 1
//需要的是小的那个
class Solution {
    public int mySqrt(int x) {
        int left = 1, right = x;
        while(left <= right){
            int sqrt = left + (right - left)/2;
            if(sqrt == x/sqrt){
                return sqrt;
            }else if(sqrt > x/sqrt){
                right = sqrt - 1;
            }else if(sqrt < x/sqrt){
                left = sqrt + 1;
            }
        }
        return right;
    }
}
```

### 7.2 [744. 寻找比目标字母大的最小字母](https://leetcode-cn.com/problems/find-smallest-letter-greater-than-target/)

给你一个排序后的字符列表 `letters` ，列表中只包含小写英文字母。另给出一个目标字母 `target`，请你寻找在这一有序列表里比目标字母大的最小字母。

```java
class Solution {
    public char nextGreatestLetter(char[] letters, char target) {
        int n = letters.length;
        int low = 0 ,high = n - 1;
        while(low <= high){
            int mid = low + (high - low) / 2;
            if(letters[mid] <= target){
                low = mid + 1;
            }else{
                high = mid - 1;
            }
        }
        if(low >= n){
            return letters[0];
        }else{
            return letters[low];
        }

    }
}
```

### 7.3 [540. 有序数组中的单一元素](https://leetcode-cn.com/problems/single-element-in-a-sorted-array/)

给定一个只包含整数的有序数组，每个元素都会出现两次，唯有一个数只会出现一次，找出这个数。

```java
//如果前面不包含单个的，那么偶数位置的数肯定是和后面一个相等
//如果相等，说明在后面 left = mid + 2
//如果不相等，说明在前面，right = mid
class Solution {
    public int singleNonDuplicate(int[] nums) {
        int n = nums.length;
        int left = 0,right = n - 1;
        while(left < right){
            int mid = left + (right - left) / 2;
            //保证m是偶数
            if(mid % 2 == 1){
                mid--;
            }
            if(nums[mid] == nums[mid + 1]){
                left = mid + 2;
            }else{
                right = mid;
            }
        }
        return nums[right];
    }
}
```

### 7.4 [278. 第一个错误的版本](https://leetcode-cn.com/problems/first-bad-version/)

你是产品经理，目前正在带领一个团队开发新的产品。不幸的是，你的产品的最新版本没有通过质量检测。由于每个版本都是基于之前的版本开发的，所以错误的版本之后的所有版本都是错的。

假设你有 n 个版本 [1, 2, ..., n]，你想找出导致之后所有版本出错的第一个错误的版本。

你可以通过调用 bool isBadVersion(version) 接口来判断版本号 version 是否在单元测试中出错。实现一个函数来查找第一个错误的版本。你应该尽量减少对调用 API 的次数。

```java
public class Solution extends VersionControl {
    public int firstBadVersion(int n) {
        int left = 1,right = n;
        while(left <= right){
            int mid = left + (right - left) / 2;
            if(isBadVersion(mid) == false){
                left = mid + 1;
            }else{
                right = mid - 1;
            }
        }
        return left;
        
    }
}
```

### 7.5 [153. 寻找旋转排序数组中的最小值](https://leetcode-cn.com/problems/find-minimum-in-rotated-sorted-array/)

假设按照升序排序的数组在预先未知的某个点上进行了旋转。例如，数组 [0,1,2,4,5,6,7] 可能变为 [4,5,6,7,0,1,2] 。

请找出其中最小的元素。

```java
class Solution {
    public int findMin(int[] nums) {
        int left = 0;
        int right = nums.length - 1;//左闭右闭区间，如果用右开区间则不方便判断右值 
        while (left < right) {//循环不变式，如果left == right，则循环结束 
            int mid = left + (right - left) / 2;//地板除，mid更靠近left
            if (nums[mid] > nums[right]) {//中值 > 右值，最小值在右半边，收缩左边界
                left = mid + 1;//因为中值 > 右值，中值肯定不是最小值，左边界可以跨过mid 
            } else if (nums[mid] < nums[right]) {//明确中值 < 右值，最小值在左半边，收缩右边界 */ 
                right = mid;//因为中值 < 右值，中值也可能是最小值，右边界只能取到mid处 */ 
            }
        }
        return nums[left];//循环结束，left == right，最小值输出nums[left]或nums[right]均可
    }
};

```

### 7.6 [34. 在排序数组中查找元素的第一个和最后一个位置](https://leetcode-cn.com/problems/find-first-and-last-position-of-element-in-sorted-array/)

给定一个按照升序排列的整数数组 nums，和一个目标值 target。找出给定目标值在数组中的开始位置和结束位置。

如果数组中不存在目标值 target，返回 [-1, -1]。



```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        //寻找target的最左侧边界
        int start = binarySearch(nums,target);
        //寻找target+1的最左侧边界
        int end = binarySearch(nums,target+1) - 1;
        if(start == nums.length || nums[start] != target){
            return new int[]{-1,-1};
        }else{
            return new int[]{start,Math.max(start,end)};
        }

    }
    //寻找左侧边界
    private int binarySearch(int[] nums, int target){
        int left = 0,right = nums.length;
        while(left < right){
            int mid = left + (right - left)/2;
            if(nums[mid] >= target){
                right = mid;
            }else{
                left = mid + 1;
            }
        }
        return left;
    }
}
```

