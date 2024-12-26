# Curiosity Report - AWS LightSail

## Introduction

AWS has tried to become the leading cloud hosting solution, and has succeeded.
It provides a huge variety of services that allow them to meet the needs of diverse customers.
However, this very flexibility can be overwhelming to many developers, as they have to learn to use a variety of tools.
This learning curve gives an incentive for developers to turn to simpler solutions, like Google's Firebase,
which provides simple backend services, including authentication and data storage.

## Why use LightSail

I have recently seen AWS LightSail advertised as the "easiest way to get started" with AWS, and was curious about what it offered.
I assumed it was aiming to compete with Firebase, and by the looks of it, "Amazon's Free Virtual Cloud Server" is aiming to do just that,
using preconfigured tech stacks and cloud resources. The way they advertise it fits exactly with many of the concerns that students have had using AWS in our class.
"You're new to AWS and find yourself intimidated by the wide variety of features and pricing plans".

The first selling point LightSail gives is that developers do not need to worry about managing cloud resources.
Most of the points we have covered in this course, from load balancers to observability, are automatically managed.
Developers just choose a plan with the resources needed for their use case, and pay a fixed monthly cost, with the option to upgrade their plan as needed.
A cost difference between LightSail and EC2 is with LightSail, what you see is what you pay, whereas EC2 has variable costs.

## Differences between LightSail and Firebase

I think a major difference between LightSail and Firebase is that LightSail is a simplified Virtual Private Server, whereas Firebase is an app development platform.
LightSail is aimed at making it easier to get cloud computing going, whereas Firebase is designed to make it easier to get an app going.
You can have "blueprints" on LightSail, which are preconfigured apps such as WordPress or NodeJS, but these are less of a
complete solution that Firebase offers.

## General Observations

The UI is much simpler than that of general AWS, with fewer things to click.
Under the hood though, LightSail is an abstraction for EC2, with much of the decisions for configuration made for you.

Despite being simpler than AWS, it still offers flexibility for developers to use more complex resources.
For example, you can migrate your LightSail instance to EC2 relatively easily. I think this helps AWS to use LightSail as
a gateway to other AWS resources, making the learning curve smoother.

## Final Thoughts

Personally, I would recommend Firebase to anyone who wants to make an app, as it handles so much very smoothly, from authentication to data storage, observability and payments.
However, if you just want a simple virtual private server, LightSail is an easy and effective way to do this.
