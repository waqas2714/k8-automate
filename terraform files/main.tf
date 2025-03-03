provider "aws" {
  region = var.aws_region
}

# Create the Master instance
resource "aws_instance" "ec2_instance_master" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = {
    Name = "Master"
  }
}

# Create the Worker instances
resource "aws_instance" "ec2_instance_worker" {
  count         = var.ec2_count
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = {
    Name = "Worker-${count.index + 1}"
  }
}

# Output the public IPs of both Master and Worker instances
output "public_ips" {
  value = concat(
    [aws_instance.ec2_instance_master.public_ip],
    [for instance in aws_instance.ec2_instance_worker : instance.public_ip]
  )
}
