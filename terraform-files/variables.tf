variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "ec2_count" {
  description = "Number of worker EC2 instances to create"
  type        = number
  default     = 3
}

variable "ami_id" {
  description = "AMI ID for the EC2 instances"
  type        = string
  default     = "ami-04b4f1a9cf54c11d0"
}

variable "instance_type" {
  description = "Instance type for the EC2 instances"
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key" {
  description = "Public SSH Key to be used for EC2 instances"
  type        = string
}
