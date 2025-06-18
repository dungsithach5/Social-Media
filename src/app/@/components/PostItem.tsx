interface PostItemProps {
    name: string;
    time: string;
    text: string;
    image: string;
  }
  
  export default function PostItem({ name, time, text, image }: PostItemProps) {
    return (
      <div className="mt-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          <img src="https://www.parents.com/thmb/lmejCapkkBYa0LQoezl2RxBi1Z0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-911983386-d50a1de241d44f829b17053ace814f4e.jpg" alt={name} className="w-10 h-10 rounded-full" />
          <div>
            <strong>{name}</strong>
            <p className="text-sm text-gray-400">{time}</p>
          </div>
        </div>
        <p className="mt-3">{text}</p>
        <img src={image} alt="Post" className="w-full rounded-lg mt-3" />
      </div>
    );
  }
  