<?php
echo "<p> Entering testing </p>";

$target_path = "";

$target_path = $target_path . basename( $_FILES['image']['name']); 

if($_FILES['image']['tmp_name'])
{
	echo "Image upload: " . $_FILES['image']['name'];
	echo "Image upload: " . $_FILES['image']['tmp_name'];
	// echo "Image Size: " . $_FILES['image']['size'];
}


if(move_uploaded_file($_FILES['image']['tmp_name'], $target_path)) {
    echo "The file ".  basename( $_FILES['image']['name']). 
    " has been uploaded";
} else{
    echo "There was an error uploading the file, please try again!";
}

/*
$base=$_POST['image'];
print $base;

if($base){
	print "Get base variable";
	//$binary=base64_decode($base);
	header('Content-Type: image/jpg');
	$file = fopen('uploaded_image.jpg', 'wb');
	fwrite($file, $base);
	fclose($file);
	echo 'Image upload complete!!, Please check your php file directory……';
}
*/
